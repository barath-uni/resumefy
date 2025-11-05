import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * DELETE JOB
 *
 * Deletes a job and all associated generated resumes and cache entries.
 * Only the user who owns the job can delete it.
 *
 * Input: { jobId: string }
 * Output: { success: boolean, message: string }
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jobId } = await req.json()

    if (!jobId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'jobId is required'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🗑️ [delete-job] Deleting job:', jobId)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get authorization header to verify user owns this job
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('user_id, resume_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      console.error('❌ [delete-job] Job not found:', jobError)
      return new Response(
        JSON.stringify({ success: false, error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user || user.id !== job.user_id) {
      console.error('❌ [delete-job] Unauthorized:', userError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [delete-job] User authorized, proceeding with deletion')

    // Delete cascade:
    // 1. Find tailored_content_cache entries for this job
    const { data: cacheEntries } = await supabase
      .from('tailored_content_cache')
      .select('id')
      .eq('job_id', jobId)

    if (cacheEntries && cacheEntries.length > 0) {
      console.log('📝 [delete-job] Found', cacheEntries.length, 'cache entries')

      // 2. Delete generated_resumes for those cache entries
      const cacheIds = cacheEntries.map(c => c.id)
      const { error: genResumesError } = await supabase
        .from('generated_resumes')
        .delete()
        .in('tailored_content_id', cacheIds)

      if (genResumesError) {
        console.error('⚠️ [delete-job] Error deleting generated resumes:', genResumesError)
      } else {
        console.log('✅ [delete-job] Deleted generated resumes')
      }

      // 3. Delete tailored_content_cache entries
      const { error: cacheError } = await supabase
        .from('tailored_content_cache')
        .delete()
        .eq('job_id', jobId)

      if (cacheError) {
        console.error('⚠️ [delete-job] Error deleting cache entries:', cacheError)
      } else {
        console.log('✅ [delete-job] Deleted cache entries')
      }
    }

    // 4. Delete the job itself
    const { error: deleteError } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)

    if (deleteError) {
      console.error('❌ [delete-job] Error deleting job:', deleteError)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to delete job: ' + deleteError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ [delete-job] Job deleted successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job deleted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('❌ [delete-job] Unexpected error:', err)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error: ' + (err as Error).message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
