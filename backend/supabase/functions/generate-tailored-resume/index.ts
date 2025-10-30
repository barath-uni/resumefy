import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { renderPDF } from './renderPDF.ts'
import {
  analyzeCompatibility,
  extractAndTailorBlocks,
  calculateFitScore,
  detectMissingSkills,
  generateRecommendations,
  decideLayout,
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
 * 3. AI STEP 2: Extract + tailor blocks using compatibility insights
 * 4. AI STEP 3: Calculate fit score (0-100%)
 * 5. AI STEP 4: Detect missing skills with certification suggestions
 * 6. AI STEP 5: Generate actionable recommendations
 * 7. AI STEP 6: Decide layout for template
 * 8. Render PDF server-side (pdfmake)
 * 9. Upload to storage
 * 10. Update database with all AI insights
 *
 * Cost: ~$0.04-0.06 per generation (6 AI calls)
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

    // ============================
    // AGENTIC AI ORCHESTRATION
    // ============================

    // AI STEP 1: Analyze compatibility between resume and JD
    console.log('🧠 [AI Step 1/6] Analyzing compatibility...')
    const compatibilityAnalysis = await analyzeCompatibility({
      resumeText: resume.raw_text,
      jobDescription: job.job_description,
      jobTitle: job.job_title
    })
    console.log('✅ [AI Step 1/6] Compatibility analysis complete:', {
      overlaps: compatibilityAnalysis.overlapAreas.length,
      gaps: compatibilityAnalysis.gapAreas.length,
      focus: compatibilityAnalysis.strategicFocus.length
    })

    // AI STEP 2: Extract and tailor content blocks using compatibility insights
    console.log('🧠 [AI Step 2/6] Extracting and tailoring content blocks...')
    const tailoredBlocks = await extractAndTailorBlocks({
      resumeText: resume.raw_text,
      jobDescription: job.job_description,
      jobTitle: job.job_title,
      compatibilityInsights: compatibilityAnalysis
    })
    console.log('✅ [AI Step 2/6] Tailored blocks extracted:', tailoredBlocks.blocks.length, 'blocks')

    // AI STEP 3: Calculate fit score (0-100%)
    console.log('🧠 [AI Step 3/6] Calculating fit score...')
    const fitScoreAnalysis = await calculateFitScore({
      originalResume: resume.raw_text,
      tailoredBlocks: tailoredBlocks.blocks,
      jobDescription: job.job_description
    })
    console.log('✅ [AI Step 3/6] Fit score calculated:', fitScoreAnalysis.score, '%')

    // AI STEP 4: Detect missing skills with certification suggestions
    console.log('🧠 [AI Step 4/6] Detecting missing skills...')
    const skillBlocks = tailoredBlocks.blocks.filter(b => b.category === 'skills')
    const missingSkillsAnalysis = await detectMissingSkills({
      resumeSkills: skillBlocks,
      jdRequirements: job.job_description,
      jobTitle: job.job_title
    })
    console.log('✅ [AI Step 4/6] Missing skills detected:', missingSkillsAnalysis.missingSkills.length)

    // AI STEP 5: Generate recommendations for improvement
    console.log('🧠 [AI Step 5/6] Generating recommendations...')
    const recommendationsAnalysis = await generateRecommendations({
      fitScore: fitScoreAnalysis.score,
      missingSkills: missingSkillsAnalysis.missingSkills,
      tailoredContent: tailoredBlocks.blocks
    })
    console.log('✅ [AI Step 5/6] Recommendations generated:', recommendationsAnalysis.recommendations.length)

    // AI STEP 6: Decide layout for template
    console.log('🧠 [AI Step 6/6] Deciding layout for template', templateName, '...')

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

    const layoutDecision = await decideLayout({
      blocks: tailoredBlocks.blocks,
      templateName: `Template ${templateName}`,
      templateConstraints: templateConstraints[templateName as 'A' | 'B' | 'C']
    })
    console.log('✅ [AI Step 6/6] Layout decided:', Object.keys(layoutDecision.layout))

    // Convert new layout format to renderPDF expected format
    // New format: { header: ["id1"], main: ["id2", "id3"], sidebar: ["id4"] }
    // Old format: { placement: { "id1": { section: "header", order: 0 } } }
    const convertedLayout = {
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
    // PDF GENERATION
    // ============================

    // STEP 7: Render PDF using pdfmake
    console.log('📄 [Step 7] Rendering PDF with pdfmake...')

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

      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to upload PDF: ${uploadError.message}`
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create download URL for PDF'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const pdfUrl = urlData.signedUrl
    console.log('✅ [Step 8] Signed URL created')

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
    console.log('🎉 [SUCCESS] Tailored resume generated with smart AI orchestration!')
    console.log('📊 Summary:', {
      fitScore: `${fitScoreAnalysis.score}%`,
      missingSkills: missingSkillsAnalysis.missingSkills.length,
      recommendations: recommendationsAnalysis.recommendations.length,
      blocks: tailoredBlocks.blocks.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        jobId,
        templateName,
        pdfUrl,
        aiInsights: {
          fitScore: fitScoreAnalysis.score,
          fitScoreBreakdown: fitScoreAnalysis.breakdown,
          missingSkillsCount: missingSkillsAnalysis.missingSkills.length,
          recommendationsCount: recommendationsAnalysis.recommendations.length
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
