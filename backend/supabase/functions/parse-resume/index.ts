import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResumeJson {
  header: {
    name: string
    email: string
    phone: string
    location: string
  }
  summary: string
  experience: Array<{
    title: string
    company: string
    dates: string
    bullets: string[]
  }>
  education: Array<{
    degree: string
    school: string
    year: string
  }>
  skills: string[]
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { resumeId, fileUrl } = await req.json()

    if (!resumeId || !fileUrl) {
      throw new Error('Missing resumeId or fileUrl')
    }

    console.log(`Parsing resume: ${resumeId}`)

    // Update status to processing
    await supabase
      .from('resumes')
      .update({ parsing_status: 'processing' })
      .eq('id', resumeId)

    // Extract file path from URL and download file from Supabase Storage
    // URL format: https://.../storage/v1/object/public/resume/user_id/timestamp.pdf
    const urlParts = fileUrl.split('/resume/')
    const filePath = urlParts[1]

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resume')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert file to base64 for OpenAI
    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    // Call OpenAI API to extract structured data
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract structured data from the resume and return ONLY valid JSON (no markdown, no explanations).

Return this exact structure:
{
  "header": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, state/country"
  },
  "summary": "Professional summary or objective",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "dates": "Start - End",
      "bullets": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "year": "Graduation Year"
    }
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3"]
}`
          },
          {
            role: 'user',
            content: `Parse this resume and extract structured data. The file is base64 encoded: ${base64.substring(0, 1000)}...` // Truncate for token limits
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const openaiData = await openaiResponse.json()
    const parsedJson: ResumeJson = JSON.parse(openaiData.choices[0].message.content)

    console.log('Successfully parsed resume:', parsedJson.header.name)

    // Update database with parsed data
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        parsed_json: parsedJson,
        parsing_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        resumeId,
        parsed: parsedJson,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error parsing resume:', error)

    // Update status to failed if we have resumeId
    if (error.resumeId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase
        .from('resumes')
        .update({ parsing_status: 'failed' })
        .eq('id', error.resumeId)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to parse resume',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
