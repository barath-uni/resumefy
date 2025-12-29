import { supabase } from './supabase'

export interface ResumeJson {
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

// Phase 3A: Text extraction result (NO structured JSON yet)
export interface ExtractResult {
  success: boolean
  resumeId?: string
  text?: string
  pages?: number
  wordCount?: number
  error?: string
}

// Phase 3B: Will be used for AI-powered tailoring (future)
export interface ParseResult {
  success: boolean
  resumeId?: string
  parsed?: ResumeJson
  error?: string
}

/**
 * Phase 3A: Extract raw text from PDF resume (library-based, no AI)
 * Uses PDF.js library in Edge Function - fast, reliable, $0 cost
 */
export async function extractResumeText(
  resumeId: string,
  fileUrl: string
): Promise<ExtractResult> {
  try {

    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: {
        resumeId,
        fileUrl,
      },
    })

    if (error) {
      console.error('❌ [extractResumeText] Error calling function:', error)
      return {
        success: false,
        error: error.message || 'Failed to extract text from resume',
      }
    }

    return data as ExtractResult
  } catch (error: any) {
    console.error('❌ [extractResumeText] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
  }
}

/**
 * Phase 3B: AI-powered resume structuring + tailoring (future)
 * This will be implemented after Phase 3A is complete
 */
export async function parseResume(
  resumeId: string,
  fileUrl: string
): Promise<ParseResult> {
  // For now, just call extractResumeText
  // In Phase 3B, this will call the tailor-resume Edge Function
  const result = await extractResumeText(resumeId, fileUrl)
  return {
    success: result.success,
    resumeId: result.resumeId,
    error: result.error,
  }
}

/**
 * Get user's resumes from database
 */
export async function getUserResumes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching resumes:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserResumes:', error)
    return null
  }
}
