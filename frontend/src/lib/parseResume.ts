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

export interface ParseResult {
  success: boolean
  resumeId?: string
  parsed?: ResumeJson
  error?: string
}

/**
 * Call parse-resume Edge Function to extract structured data from uploaded resume
 */
export async function parseResume(
  resumeId: string,
  fileUrl: string
): Promise<ParseResult> {
  try {
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: {
        resumeId,
        fileUrl,
      },
    })

    if (error) {
      console.error('Error calling parse-resume function:', error)
      return {
        success: false,
        error: error.message || 'Failed to parse resume',
      }
    }

    return data as ParseResult
  } catch (error: any) {
    console.error('Error parsing resume:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    }
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
