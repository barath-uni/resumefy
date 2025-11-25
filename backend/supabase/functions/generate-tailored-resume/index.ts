import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderPDF } from './renderPDF.ts'
import {
  conversationalTailoring,
} from '../_shared/aiHelpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * MASTER FUNCTION: Generate Tailored Resume with Agentic Orchestration
 *
 * Phase 3B: Smart AI-powered resume tailoring with explicit steps
 *
 * This orchestrates the complete flow:
 * 1. Fetch job + resume data
 * 2. AI STEP 1: Analyze compatibility (overlaps, gaps, strategic focus)
 * 3. AI STEP 2A: Extract raw blocks (pure extraction, no tailoring)
 * 4. AI STEP 2B: Tailor blocks (rewrite with JD keywords, assign priorities)
 * 5. AI STEP 3: Calculate fit score (0-100%)
 * 6. AI STEP 4: Detect missing skills with certification suggestions
 * 7. AI STEP 5: Generate actionable recommendations
 * 8. AI STEP 6: Decide layout for template
 * 9. Render PDF server-side (pdfmake)
 * 10. Upload to storage
 * 11. Update database with all AI insights
 *
 * Cost: ~$0.05-0.07 per generation (7 AI calls - 2-step extraction flow)
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId, templateName } = await req.json()

    if (!jobId || !templateName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'jobId and templateName are required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['A', 'B', 'C'].includes(templateName)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'templateName must be A, B, or C'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🎨 [generate-tailored-resume] Starting for jobId:', jobId, 'template:', templateName)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update status to 'generating'
    await supabase
      .from('jobs')
      .update({
        generation_status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    // STEP 1: Fetch job data (includes resume_id, job_description)
    console.log('📋 [generate-tailored-resume] Step 1: Fetching job data...')
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*, resumes(*)')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('❌ [generate-tailored-resume] Job not found:', jobError)
      await supabase
        .from('jobs')
        .update({ generation_status: 'failed' })
        .eq('id', jobId)

      return new Response(
        JSON.stringify({ success: false, error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const resume = job.resumes
    if (!resume || !resume.raw_text) {
      console.error('❌ [generate-tailored-resume] Resume or raw_text not found')
      await supabase
        .from('jobs')
        .update({ generation_status: 'failed' })
        .eq('id', jobId)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Resume text not extracted. Please extract text first (Phase 3A).'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [generate-tailored-resume] Job data fetched:', job.job_title)
    console.log('📄 [generate-tailored-resume] Resume text length:', resume.raw_text.length)

    // 🔍 DETAILED LOGGING: Check resume completeness
    console.log('🔍 [DEBUG] RESUME RAW TEXT ANALYSIS FROM DATABASE:')
    console.log(`  - Resume ID: ${resume.id}`)
    console.log(`  - Raw text length: ${resume.raw_text.length} chars`)
    console.log(`  - First 400 chars: ${resume.raw_text.substring(0, 400)}`)
    console.log(`  - Last 400 chars: ...${resume.raw_text.substring(resume.raw_text.length - 400)}`)

    // Check for critical sections in raw text
    const rawTextLower = resume.raw_text.toLowerCase()
    console.log(`  - Contains "SKILLS" section: ${rawTextLower.includes('skill')}`)
    console.log(`  - Contains "PROJECTS" section: ${rawTextLower.includes('project')}`)
    console.log(`  - Contains "EDUCATION" section: ${rawTextLower.includes('education')}`)
    console.log(`  - Contains "EXPERIENCE" section: ${rawTextLower.includes('experience')}`)
    console.log(`  - Number of "skill" occurrences: ${(resume.raw_text.match(/skill/gi) || []).length}`)
    console.log(`  - Number of "project" occurrences: ${(resume.raw_text.match(/project/gi) || []).length}`)

    // ============================
    // PAYWALL CHECK - CRITICAL CONTROL POINT
    // ============================
    const userId = job.user_id

    console.log('🔒 [Paywall] Checking if user can generate PDF...')
    const { data: paywallCheck, error: paywallError } = await supabase.rpc('can_generate_pdf', {
      p_user_id: userId
    })

    if (paywallError) {
      console.error('❌ [Paywall] Error checking limits:', paywallError)
      // Don't block on paywall check error - fail open (or you could fail closed)
    } else if (!paywallCheck.allowed) {
      console.log('❌ [Paywall] PDF generation blocked:', paywallCheck.reason)
      console.log('📊 [Paywall] User tier:', paywallCheck.tier)

      await supabase
        .from('jobs')
        .update({ generation_status: 'failed' })
        .eq('id', jobId)

      return new Response(
        JSON.stringify({
          success: false,
          error: 'payment_required',
          paywall: {
            reason: paywallCheck.reason,
            tier: paywallCheck.tier,
            upgrade_required: true,
            message: paywallCheck.message || 'Upgrade to Basic or Pro to generate PDF resumes'
          }
        }),
        {
          status: 402, // 402 Payment Required
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('✅ [Paywall] User authorized to generate PDF (tier:', paywallCheck.tier, ')')

    // ============================
    // LAYER 1 CACHE CHECK: Tailored Content (resume + job)
    // ============================
    console.log('💾 [Cache Layer 1] Checking for cached tailored content...')
    const { data: cachedContent, error: cacheError } = await supabase
      .from('tailored_content_cache')
      .select('*')
      .eq('resume_id', resume.id)
      .eq('job_id', jobId)
      .single()

    let tailoredBlocks: any
    let fitScoreAnalysis: any
    let missingSkillsAnalysis: any
    let recommendationsAnalysis: any
    let layoutDecision: any
    let convertedLayout: any
    let cachedContentId: string | null = null

    if (cachedContent && !cacheError) {
      console.log('✅ [Cache Layer 1] HIT - Using cached tailored content (resume+job)')
      console.log('💰 [Cost Saved] Skipped 5 expensive AI calls!')

      tailoredBlocks = { blocks: cachedContent.tailored_blocks }
      fitScoreAnalysis = {
        score: cachedContent.fit_score,
        breakdown: cachedContent.fit_score_breakdown
      }
      missingSkillsAnalysis = {
        missingSkills: cachedContent.missing_skills || []
      }
      recommendationsAnalysis = {
        recommendations: cachedContent.recommendations || []
      }

      // Extract other data from cached layout decision
      const cachedLayoutDecision = cachedContent.layout_decision
      layoutDecision = cachedLayoutDecision

      // We'll still need to convert layout for rendering
      convertedLayout = {
        templateName: `Template ${templateName}`,
        placement: {} as any,
        fits: true,
        overflow: {},
        warnings: []
      }

      let globalOrder = 0
      for (const section of ['header', 'main', 'sidebar', 'footer']) {
        const blockIds = layoutDecision.layout?.[section as keyof typeof layoutDecision.layout] || []
        for (const blockId of blockIds) {
          convertedLayout.placement[blockId] = {
            section: section === 'footer' ? 'main' : section as 'header' | 'main' | 'sidebar',
            order: globalOrder++,
            fontSize: 11
          }
        }
      }

      cachedContentId = cachedContent.id

    } else {
      console.log('❌ [Cache Layer 1] MISS - Generating new tailored content with AI...')

      // ============================
      // NEW CONVERSATIONAL AI FLOW (Single conversation, 7 steps)
      // ============================

      // Define template constraints for layout decision
      const templateConstraints = {
        A: {
          name: 'Template A - Modern Single Column',
          type: 'single-column',
          maxLines: 50,
          sections: { header: { maxLines: 5 }, main: { maxLines: 45 } },
          fontSizes: { name: 24, heading: 14, body: 11, minBody: 9 },
          spacing: { betweenSections: 1, betweenEntries: 0.5 }
        },
        B: {
          name: 'Template B - Professional Two Column',
          type: 'two-column',
          maxLines: 50,
          sections: { header: { maxLines: 5 }, main: { maxLines: 45 }, sidebar: { maxLines: 45 } },
          fontSizes: { name: 24, heading: 14, body: 11, minBody: 9 },
          spacing: { betweenSections: 1, betweenEntries: 0.5 }
        },
        C: {
          name: 'Template C - Modern with Color',
          type: 'single-column-color',
          maxLines: 50,
          sections: { header: { maxLines: 5 }, main: { maxLines: 45 } },
          fontSizes: { name: 24, heading: 14, body: 11, minBody: 9 },
          spacing: { betweenSections: 1, betweenEntries: 0.5 }
        }
      }

      // Execute all 7 AI steps in a single conversation (2-step extraction flow)
      const aiResults = await conversationalTailoring({
        resumeText: resume.raw_text,
        jobDescription: job.job_description,
        jobTitle: job.job_title,
        templateName: `Template ${templateName}`,
        templateConstraints: templateConstraints[templateName as 'A' | 'B' | 'C']
      })

      // Extract results from conversation
      // Note: aiResults.rawBlocks contains the unmodified extraction (Step 2A)
      // We use aiResults.blocks (Step 2B) which has been tailored with JD keywords
      tailoredBlocks = aiResults.blocks
      fitScoreAnalysis = aiResults.fitScore
      missingSkillsAnalysis = aiResults.missingSkills
      recommendationsAnalysis = aiResults.recommendations
      layoutDecision = aiResults.layout
      const detectedLanguage = aiResults.detectedLanguage

      console.log('✅ [AI] All 7 steps complete via conversational flow (2-step extraction):', {
        blocks: tailoredBlocks.blocks.length,
        fitScore: fitScoreAnalysis.score,
        missingSkills: missingSkillsAnalysis.missingSkills.length,
        recommendations: recommendationsAnalysis.recommendations.length,
        layoutSections: Object.keys(layoutDecision.layout),
        language: `${detectedLanguage.languageName} (${detectedLanguage.language})`
      })

      // Convert new layout format to renderPDF expected format
      // New format: { header: ["id1"], main: ["id2", "id3"], sidebar: ["id4"] }
      // Old format: { placement: { "id1": { section: "header", order: 0 } } }
      convertedLayout = {
        templateName: `Template ${templateName}`,
        placement: {} as any,
        fits: true,
        overflow: {},
        warnings: []
      }

      let globalOrder = 0
      for (const section of ['header', 'main', 'sidebar', 'footer']) {
        const blockIds = layoutDecision.layout[section as keyof typeof layoutDecision.layout] || []
        for (const blockId of blockIds) {
          convertedLayout.placement[blockId] = {
            section: section === 'footer' ? 'main' : section as 'header' | 'main' | 'sidebar',
            order: globalOrder++,
            fontSize: 11
          }
        }
      }

      // ============================
      // SAVE TO CACHE LAYER 1
      // ============================
      console.log('💾 [Cache Layer 1] Saving tailored content for future use...')
      const { data: savedContent, error: saveError } = await supabase
        .from('tailored_content_cache')
        .insert({
          resume_id: resume.id,
          job_id: jobId,
          tailored_blocks: tailoredBlocks.blocks,
          layout_decision: layoutDecision,
          fit_score: fitScoreAnalysis.score,
          fit_score_breakdown: fitScoreAnalysis.breakdown,
          missing_skills: missingSkillsAnalysis.missingSkills,
          recommendations: recommendationsAnalysis.recommendations,
          detected_language: detectedLanguage.language,
          detected_language_name: detectedLanguage.languageName
        })
        .select()
        .single()

      if (saveError) {
        console.warn('⚠️ [Cache Layer 1] Failed to save cache:', saveError.message)
      } else {
        console.log('✅ [Cache Layer 1] Content cached successfully')
        cachedContentId = savedContent.id
      }
    }

    // ============================
    // LAYER 2 CACHE CHECK: Rendered PDF (content + template)
    // ============================
    let pdfUrl: string

    if (cachedContentId) {
      console.log('💾 [Cache Layer 2] Checking for cached PDF (content+template)...')
      const { data: cachedPDF, error: pdfCacheError } = await supabase
        .from('generated_resumes')
        .select('pdf_url')
        .eq('tailored_content_id', cachedContentId)
        .eq('template_id', templateName)
        .single()

      if (cachedPDF && !pdfCacheError) {
        console.log('✅ [Cache Layer 2] HIT - Using cached PDF')
        console.log('💰 [Cost Saved] Skipped PDF rendering and upload!')
        pdfUrl = cachedPDF.pdf_url
      } else {
        console.log('❌ [Cache Layer 2] MISS - Generating new PDF...')
        pdfUrl = await generateAndCachePDF()
      }
    } else {
      console.log('⚠️ [Cache Layer 2] Skipped - No content cache ID available')
      pdfUrl = await generateAndCachePDF()
    }

    // Helper function to generate and cache PDF
    async function generateAndCachePDF(): Promise<string> {
      // STEP 7: Render PDF using pdfmake
      console.log('📄 [Step 7] Rendering PDF with pdfmake...')
      console.log('📄 [Step 7] Blocks to render:', tailoredBlocks.blocks.length)
      console.log('📄 [Step 7] Block IDs:', tailoredBlocks.blocks.map((b: any) => b.id))
      console.log('📄 [Step 7] Layout placement:', Object.keys(convertedLayout.placement))

      const pdfBuffer = await renderPDF(
        tailoredBlocks.blocks,
        convertedLayout,
        templateName
      )

      console.log('✅ [Step 7] PDF rendered, size:', pdfBuffer.length, 'bytes')

      // STEP 8: Upload PDF to storage
      const timestamp = Date.now()
      const fileName = `${job.user_id}/${resume.id}/${jobId}/template_${templateName}.pdf`

      console.log('📤 [Step 8] Uploading PDF to storage:', fileName)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resume')
        .upload(fileName, pdfBuffer, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true, // Overwrite if regenerated
        })

      if (uploadError) {
        console.error('❌ [generate-tailored-resume] Failed to upload PDF:', uploadError)
        await supabase
          .from('jobs')
          .update({ generation_status: 'failed' })
          .eq('id', jobId)

        throw new Error(`Failed to upload PDF: ${uploadError.message}`)
      }

      console.log('✅ [Step 8] PDF uploaded successfully:', uploadData.path)

      // Get signed URL (valid for 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('resume')
        .createSignedUrl(uploadData.path, 31536000)

      if (urlError || !urlData) {
        console.error('❌ [Step 8] Failed to create signed URL:', urlError)
        await supabase
          .from('jobs')
          .update({ generation_status: 'failed' })
          .eq('id', jobId)

        throw new Error('Failed to create download URL for PDF')
      }

      const generatedPdfUrl = urlData.signedUrl
      console.log('✅ [Step 8] Signed URL created')

      // Save to Layer 2 cache
      if (cachedContentId) {
        console.log('💾 [Cache Layer 2] Saving PDF to cache...')
        const { error: savePdfError } = await supabase
          .from('generated_resumes')
          .insert({
            tailored_content_id: cachedContentId,
            template_id: templateName,
            pdf_url: generatedPdfUrl
          })

        if (savePdfError) {
          console.warn('⚠️ [Cache Layer 2] Failed to save PDF cache:', savePdfError.message)
        } else {
          console.log('✅ [Cache Layer 2] PDF cached successfully')
        }
      }

      return generatedPdfUrl
    }

    // ============================
    // DATABASE UPDATE
    // ============================

    // STEP 9: Update database with completion status + all AI insights
    console.log('💾 [Step 9] Saving to database with AI insights...')
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        generation_status: 'completed',
        template_used: templateName,
        pdf_url: pdfUrl,
        tailored_json: { blocks: tailoredBlocks.blocks, layout: convertedLayout },
        fit_score: fitScoreAnalysis.score,
        fit_score_breakdown: fitScoreAnalysis.breakdown,
        missing_skills: missingSkillsAnalysis.missingSkills,
        recommendations: recommendationsAnalysis.recommendations,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('❌ [Step 9] Failed to update job:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update job record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [Step 9] Database updated with AI insights')
    console.log('🎉 [SUCCESS] Tailored resume generated!')
    console.log('📊 Summary:', {
      fitScore: `${fitScoreAnalysis.score}%`,
      blocks: tailoredBlocks.blocks.length,
      cacheUsed: cachedContent ? 'Layer 1 (content)' : 'None'
    })

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        templateName,
        pdfUrl,
        aiInsights: {
          fitScore: fitScoreAnalysis.score,
          fitScoreBreakdown: fitScoreAnalysis.breakdown
        },
        cacheInfo: {
          contentCacheHit: !!cachedContent,
          aiCallsSaved: cachedContent ? 5 : 0
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ [generate-tailored-resume] Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
