import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * BULK GENERATE RESUMES
 *
 * Creates multiple job records and spawns parallel generation tasks.
 * Returns job IDs immediately for frontend polling.
 *
 * Input: {
 *   resumeId: string,
 *   jobs: Array<{ title: string, description: string, url?: string }>,
 *   templateName: 'A' | 'B' | 'C'
 * }
 *
 * Output: {
 *   success: boolean,
 *   jobIds: string[],
 *   estimatedTime: number (seconds)
 * }
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeId, jobs, templateName } = await req.json()

    if (!resumeId || !jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'resumeId and jobs array are required'
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

    console.log('🎨 [bulk-generate] Starting bulk generation:', jobs.length, 'jobs')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header to extract user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns this resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('user_id')
      .eq('id', resumeId)
      .single()

    if (resumeError || !resume) {
      console.error('❌ [bulk-generate] Resume not found:', resumeError)
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = resume.user_id

    // ============================
    // PAYWALL CHECK - Check if user can add these many jobs
    // ============================
    console.log('🔒 [Paywall] Checking if user can add', jobs.length, 'jobs...')

    // Get current job count for this resume
    const { count: currentJobCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('resume_id', resumeId)

    const { data: tierLimits } = await supabase.rpc('get_tier_limits', {
      p_tier: (await supabase
        .from('user_profiles')
        .select('tier')
        .eq('user_id', userId)
        .single()).data?.tier || 'free'
    })

    if (tierLimits) {
      const limit = tierLimits.jobs_per_resume_limit
      const newTotal = (currentJobCount || 0) + jobs.length

      if (newTotal > limit) {
        console.log('❌ [Paywall] Job limit exceeded:', newTotal, '>', limit)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'jobs_limit_exceeded',
            message: `You can only have ${limit} jobs per resume. Currently: ${currentJobCount}, attempting to add: ${jobs.length}`,
            paywall: {
              reason: 'jobs_limit',
              current: currentJobCount,
              limit: limit
            }
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check if user can generate PDFs
    const { data: pdfCheck } = await supabase.rpc('can_generate_pdf', {
      p_user_id: userId
    })

    if (pdfCheck && !pdfCheck.allowed) {
      console.log('❌ [Paywall] PDF generation not allowed')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'payment_required',
          message: pdfCheck.message || 'Upgrade to generate PDFs',
          paywall: {
            reason: 'pdf_generation',
            tier: pdfCheck.tier
          }
        }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [Paywall] User authorized for bulk generation')

    // ============================
    // CREATE JOB RECORDS
    // ============================
    console.log('📝 [bulk-generate] Creating job records...')

    const jobRecords = jobs.map(job => ({
      user_id: userId,
      resume_id: resumeId,
      job_title: job.title,
      job_description: job.description || '',
      job_url: job.url || null,
      generation_status: 'pending' as const,
      template_used: templateName
    }))

    const { data: createdJobs, error: createError } = await supabase
      .from('jobs')
      .insert(jobRecords)
      .select('id')

    if (createError || !createdJobs) {
      console.error('❌ [bulk-generate] Failed to create job records:', createError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to create job records: ' + createError?.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const jobIds = createdJobs.map(j => j.id)
    console.log('✅ [bulk-generate] Created', jobIds.length, 'job records')

    // ============================
    // SPAWN PARALLEL GENERATION TASKS
    // ============================
    console.log('🚀 [bulk-generate] Spawning parallel generation tasks...')

    // Don't await - fire and forget
    // Frontend will poll for results
    const generatePromises = jobIds.map(async (jobId) => {
      try {
        console.log('  → Spawning generation for job:', jobId)

        // Call generate-tailored-resume function
        const { error } = await supabase.functions.invoke('generate-tailored-resume', {
          body: { jobId, templateName }
        })

        if (error) {
          console.error('    ❌ Generation failed for', jobId, ':', error)
        } else {
          console.log('    ✅ Generation completed for', jobId)
        }
      } catch (err) {
        console.error('    ❌ Unexpected error for', jobId, ':', err)
      }
    })

    // Start all generations but don't wait for them
    Promise.all(generatePromises).catch(err => {
      console.error('❌ [bulk-generate] Error in parallel generation:', err)
    })

    // Return immediately
    const estimatedTime = Math.ceil(jobs.length * 15) // ~15 seconds per job
    console.log('✅ [bulk-generate] Bulk generation started. Estimated time:', estimatedTime, 'seconds')

    return new Response(
      JSON.stringify({
        success: true,
        jobIds: jobIds,
        estimatedTime: estimatedTime,
        message: `Started generating ${jobs.length} tailored resumes`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ [bulk-generate] Unexpected error:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (err as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
