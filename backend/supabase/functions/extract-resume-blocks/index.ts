import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: 'contact' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'custom'
  priority: number // 1-10, AI decides importance
  content: any
  metadata: {
    estimatedLines: number
    isOptional: boolean
    keywords: string[]
  }
}

interface FlexibleResumeData {
  blocks: ContentBlock[]
  suggestedTemplate: 'single-column' | 'two-column' | 'modern'
  totalEstimatedLines: number
  detectedCategories: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeId } = await req.json()

    if (!resumeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'resumeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📦 [extract-resume-blocks] Processing resumeId:', resumeId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch raw_text from database (Phase 3A output)
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('raw_text, page_count')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      console.error('❌ [extract-resume-blocks] Resume not found:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!resume.raw_text) {
      console.error('❌ [extract-resume-blocks] No raw_text available. Run Phase 3A first.')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No extracted text available. Please extract text first (Phase 3A).'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📄 [extract-resume-blocks] Raw text length:', resume.raw_text.length, 'chars')

    // Call OpenAI to extract flexible blocks
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('❌ [extract-resume-blocks] OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are an expert resume content analyzer. Your job is to extract resume content as FLEXIBLE BLOCKS with NO rigid structure.

CRITICAL RULES:
1. DO NOT force every resume into the same schema
2. ONLY extract sections that actually exist in the resume
3. If a section is missing (e.g., no certifications), DO NOT create an empty block
4. Prioritize blocks based on relevance (1-10, where 10 is most important)
5. Estimate how many lines each block will take when rendered
6. Identify if each block is optional (can be removed if space is tight)

BLOCK TYPES:
- header: Name, contact info (phone, email, LinkedIn, location)
- section: Experience entries, education entries, projects, certifications
- list: Skills, technologies, languages
- text: Summary, objective, achievements

CATEGORIES:
- contact: Contact information
- experience: Work experience, internships
- education: Degrees, schools, courses
- skills: Technical skills, soft skills, languages
- certifications: Certifications, licenses
- projects: Personal projects, portfolio items
- custom: Any other unique sections (publications, awards, volunteer work, etc.)

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "blocks": [
    {
      "id": "unique-id",
      "type": "header|section|list|text",
      "category": "contact|experience|education|skills|certifications|projects|custom",
      "priority": 1-10,
      "content": <extracted content - structure depends on block type>,
      "metadata": {
        "estimatedLines": <number>,
        "isOptional": true|false,
        "keywords": ["keyword1", "keyword2"]
      }
    }
  ],
  "suggestedTemplate": "single-column|two-column|modern",
  "totalEstimatedLines": <sum of all blocks>,
  "detectedCategories": ["experience", "education", "skills"]
}`

    const userPrompt = `Extract flexible content blocks from this resume text. Remember: only extract sections that actually exist. Do not create empty blocks.

Resume Text:
${resume.raw_text}

Return the flexible block structure as JSON.`

    console.log('🤖 [extract-resume-blocks] Calling OpenAI GPT-4o-mini...')

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Low temperature for consistent extraction
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('❌ [extract-resume-blocks] OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API error: ${openaiResponse.statusText}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const extractedData: FlexibleResumeData = JSON.parse(openaiData.choices[0].message.content)

    console.log('✅ [extract-resume-blocks] Extracted', extractedData.blocks.length, 'blocks')
    console.log('📊 [extract-resume-blocks] Detected categories:', extractedData.detectedCategories)
    console.log('📐 [extract-resume-blocks] Total estimated lines:', extractedData.totalEstimatedLines)
    console.log('🎨 [extract-resume-blocks] Suggested template:', extractedData.suggestedTemplate)

    // Save extracted blocks to database
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        parsed_json: extractedData, // Store in existing parsed_json column
        parsing_status: 'blocks_extracted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) {
      console.error('❌ [extract-resume-blocks] Failed to save blocks:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save extracted blocks to database'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        resumeId,
        blocks: extractedData.blocks,
        suggestedTemplate: extractedData.suggestedTemplate,
        detectedCategories: extractedData.detectedCategories,
        totalEstimatedLines: extractedData.totalEstimatedLines,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ [extract-resume-blocks] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
