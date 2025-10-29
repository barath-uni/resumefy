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
  priority: number
  content: any
  metadata: {
    estimatedLines: number
    isOptional: boolean
    keywords: string[]
  }
}

interface TemplateConstraints {
  name: string
  type: 'single-column' | 'two-column' | 'modern'
  maxLines: number // Total lines available (e.g., 50 lines for 1-page)
  sections: {
    header: { maxLines: number }
    main: { maxLines: number }
    sidebar?: { maxLines: number; preferredCategories: string[] }
  }
  fontSizes: {
    name: number
    heading: number
    body: number
    minBody: number // Minimum readable font size
  }
  spacing: {
    betweenSections: number // Lines of spacing
    betweenEntries: number
  }
}

interface LayoutDecision {
  templateName: string
  placement: {
    [blockId: string]: {
      section: 'main' | 'sidebar' | 'header'
      order: number
      fontSize: number
      maxLines?: number // Truncate if block exceeds this
    }
  }
  fits: boolean // Does content fit in 1 page?
  overflow: {
    hasOverflow: boolean
    overflowLines: number
    recommendations: string[] // E.g., "Remove certifications block", "Reduce font to 10pt"
  }
  warnings: string[]
}

// Template A: Modern single-column (like resume.io's "Professional" template)
const TEMPLATE_A_CONSTRAINTS: TemplateConstraints = {
  name: 'Template A - Modern Single Column',
  type: 'single-column',
  maxLines: 50, // 1 page = ~50 lines with 11pt font
  sections: {
    header: { maxLines: 5 },
    main: { maxLines: 45 },
  },
  fontSizes: {
    name: 24,
    heading: 14,
    body: 11,
    minBody: 9,
  },
  spacing: {
    betweenSections: 1,
    betweenEntries: 0.5,
  },
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeId, templateName = 'Template A - Modern Single Column' } = await req.json()

    if (!resumeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'resumeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🎨 [decide-layout] Processing resumeId:', resumeId, 'Template:', templateName)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch extracted blocks from database (Phase 3C.1 output)
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('parsed_json, parsing_status')
      .eq('id', resumeId)
      .single()

    if (fetchError || !resume) {
      console.error('❌ [decide-layout] Resume not found:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (resume.parsing_status !== 'blocks_extracted' || !resume.parsed_json?.blocks) {
      console.error('❌ [decide-layout] Blocks not extracted yet. Run Phase 3C.1 first.')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Blocks not extracted. Please run extract-resume-blocks first (Phase 3C.1).'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const blocks: ContentBlock[] = resume.parsed_json.blocks

    console.log('📦 [decide-layout] Found', blocks.length, 'blocks to layout')

    // Get template constraints (for now, hardcoded Template A)
    const template = TEMPLATE_A_CONSTRAINTS

    // Call OpenAI to decide layout
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.error('❌ [decide-layout] OPENAI_API_KEY not configured')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Supabase secrets.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are an expert resume layout designer. Your job is to intelligently decide how to place content blocks within a specific template's constraints.

TEMPLATE CONSTRAINTS:
${JSON.stringify(template, null, 2)}

YOUR TASK:
1. Decide which section (main/sidebar/header) each block should go in
2. Determine the optimal order of blocks
3. Set appropriate font sizes for each block
4. Check if content fits in ${template.maxLines} lines (1 page)
5. If overflow exists, intelligently handle it:
   - Remove lowest-priority optional blocks
   - Truncate older work experience entries
   - Reduce font sizes (but not below ${template.fontSizes.minBody}pt)
   - Provide clear recommendations

CRITICAL RULES:
1. Header (name, contact) ALWAYS goes in header section
2. High-priority blocks (priority 8-10) should be placed first
3. Low-priority optional blocks can be removed if space is tight
4. Experience section should show most recent jobs first
5. Skills/certifications can go in sidebar if template supports it
6. DO NOT sacrifice readability - if font is too small, recommend removing content instead

OUTPUT FORMAT:
Return a JSON object:
{
  "templateName": "${template.name}",
  "placement": {
    "block-id-1": {
      "section": "header|main|sidebar",
      "order": 1,
      "fontSize": 11,
      "maxLines": 5  // Optional: truncate block if it exceeds this
    }
  },
  "fits": true|false,
  "overflow": {
    "hasOverflow": false,
    "overflowLines": 0,
    "recommendations": []
  },
  "warnings": ["Font reduced to 10pt", "Removed certifications block"]
}`

    const userPrompt = `Given these content blocks, decide the optimal layout for ${template.name}.

Content Blocks:
${JSON.stringify(blocks, null, 2)}

Return the layout decision as JSON. Make sure content fits in ${template.maxLines} lines (1 page). Be intelligent about handling overflow.`

    console.log('🤖 [decide-layout] Calling OpenAI GPT-4o-mini...')

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
        temperature: 0.2, // Slightly higher for creative layout decisions
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('❌ [decide-layout] OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({
          success: false,
          error: `OpenAI API error: ${openaiResponse.statusText}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiData = await openaiResponse.json()
    const layoutDecision: LayoutDecision = JSON.parse(openaiData.choices[0].message.content)

    console.log('✅ [decide-layout] Layout decision made')
    console.log('📐 [decide-layout] Fits in 1 page:', layoutDecision.fits)
    console.log('⚠️  [decide-layout] Has overflow:', layoutDecision.overflow.hasOverflow)
    if (layoutDecision.overflow.hasOverflow) {
      console.log('💡 [decide-layout] Recommendations:', layoutDecision.overflow.recommendations)
    }

    // Save layout decision to database
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        parsed_json: {
          ...resume.parsed_json,
          layout: layoutDecision, // Add layout to existing parsed_json
        },
        parsing_status: 'layout_decided',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) {
      console.error('❌ [decide-layout] Failed to save layout:', updateError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save layout decision to database'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        resumeId,
        layout: layoutDecision,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ [decide-layout] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
