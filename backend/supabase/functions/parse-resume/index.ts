import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
// Import PDF.js for text extraction (no AI needed!)
import * as pdfjsLib from 'npm:pdfjs-dist@4.0.379'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log(`📄 [parse-resume] Extracting text from resume: ${resumeId}`)

    // Update status to processing
    await supabase
      .from('resumes')
      .update({ parsing_status: 'processing' })
      .eq('id', resumeId)

    // Extract file path from URL and download file from Supabase Storage
    // URL format: https://.../storage/v1/object/public/resume/user_id/timestamp.pdf
    const urlParts = fileUrl.split('/resume/')
    const filePath = urlParts[1]

    console.log(`📥 [parse-resume] Downloading file: ${filePath}`)

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resume')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    console.log(`✅ [parse-resume] File downloaded, size: ${fileData.size} bytes`)

    // Convert Blob to ArrayBuffer for PDF.js
    const arrayBuffer = await fileData.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    console.log(`🔍 [parse-resume] Parsing PDF with PDF.js library...`)

    // Load PDF document using PDF.js (NO AI, pure library-based extraction)
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    })

    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages

    console.log(`📖 [parse-resume] PDF has ${numPages} pages`)

    // Extract text from all pages
    let rawText = ''
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Join text items with spaces, preserve line breaks
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      rawText += pageText + '\n\n'
    }

    // Clean up extracted text
    rawText = rawText.trim()
    const wordCount = rawText.split(/\s+/).length

    console.log(`✅ [parse-resume] Extracted ${wordCount} words from ${numPages} pages`)

    // Update database with raw text (NO structured JSON yet - that's Phase 3B)
    const { error: updateError } = await supabase
      .from('resumes')
      .update({
        raw_text: rawText,
        page_count: numPages,
        extracted_at: new Date().toISOString(),
        parsing_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`)
    }

    console.log(`💾 [parse-resume] Saved to database successfully`)

    return new Response(
      JSON.stringify({
        success: true,
        resumeId,
        text: rawText,
        pages: numPages,
        wordCount,
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
