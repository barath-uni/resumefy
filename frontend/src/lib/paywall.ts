import { supabase } from './supabase'

/**
 * Paywall Check Result
 */
export interface PaywallCheck {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
  tier?: string
  upgrade_required?: boolean
  message?: string
  remaining?: number
}

/**
 * Check if user can upload another resume
 */
export async function checkCanUploadResume(userId: string): Promise<PaywallCheck> {
  try {
    const { data, error } = await supabase.rpc('can_upload_resume', {
      p_user_id: userId
    })

    if (error) {
      console.error('[Paywall] Error checking resume upload limit:', error)
      // Fail open on error
      return {
        allowed: true,
        tier: 'unknown'
      }
    }

    return data as PaywallCheck
  } catch (err) {
    console.error('[Paywall] Unexpected error:', err)
    return {
      allowed: true,
      tier: 'unknown'
    }
  }
}

/**
 * Check if user can add another job description to a resume
 */
export async function checkCanAddJob(userId: string, resumeId: string): Promise<PaywallCheck> {
  try {
    const { data, error } = await supabase.rpc('can_add_job', {
      p_user_id: userId,
      p_resume_id: resumeId
    })

    if (error) {
      console.error('[Paywall] Error checking job add limit:', error)
      // Fail open on error
      return {
        allowed: true,
        tier: 'unknown'
      }
    }

    return data as PaywallCheck
  } catch (err) {
    console.error('[Paywall] Unexpected error:', err)
    return {
      allowed: true,
      tier: 'unknown'
    }
  }
}

/**
 * Check if user can generate PDFs
 */
export async function checkCanGeneratePDF(userId: string): Promise<PaywallCheck> {
  try {
    const { data, error } = await supabase.rpc('can_generate_pdf', {
      p_user_id: userId
    })

    if (error) {
      console.error('[Paywall] Error checking PDF generation permission:', error)
      // Fail open on error
      return {
        allowed: true,
        tier: 'unknown'
      }
    }

    return data as PaywallCheck
  } catch (err) {
    console.error('[Paywall] Unexpected error:', err)
    return {
      allowed: true,
      tier: 'unknown'
    }
  }
}

/**
 * Get user's current tier and limits
 */
export async function getUserTier(userId: string): Promise<{
  tier: string
  resumes_limit: number
  jobs_per_resume_limit: number
  can_generate_pdfs: boolean
}> {
  try {
    // First get user's tier from profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return {
        tier: 'free',
        resumes_limit: 1,
        jobs_per_resume_limit: 5,
        can_generate_pdfs: false
      }
    }

    // Get limits for this tier
    const { data: limits, error: limitsError } = await supabase.rpc('get_tier_limits', {
      p_tier: profile.tier
    })

    if (limitsError || !limits || limits.length === 0) {
      return {
        tier: profile.tier || 'free',
        resumes_limit: 1,
        jobs_per_resume_limit: 5,
        can_generate_pdfs: false
      }
    }

    return {
      tier: profile.tier,
      ...limits[0]
    }
  } catch (err) {
    console.error('[Paywall] Error getting user tier:', err)
    return {
      tier: 'free',
      resumes_limit: 1,
      jobs_per_resume_limit: 5,
      can_generate_pdfs: false
    }
  }
}

/**
 * Tier display names
 */
export const TIER_NAMES = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro'
}

/**
 * Tier colors for badges
 */
export const TIER_COLORS = {
  free: 'gray',
  basic: 'blue',
  pro: 'purple'
}
