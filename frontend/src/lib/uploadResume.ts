import { supabase } from "./supabase"

export interface UploadResult {
  success: boolean
  resumeId?: string
  fileUrl?: string
  error?: string
}

/**
 * Upload resume file to Supabase Storage and create database record
 */
export async function uploadResume(file: File, userId: string): Promise<UploadResult> {
  try {
    console.log('🚀 Starting upload...', { fileName: file.name, fileSize: file.size, fileType: file.type, userId })

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ]

    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type)
      return {
        success: false,
        error: 'Invalid file type. Please upload PDF or DOCX files only.'
      }
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size)
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB.'
      }
    }

    // Generate unique file name
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${timestamp}.${fileExt}`

    console.log('📤 Uploading to storage...', { fileName })

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resume')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    console.log('📤 Upload response:', { uploadData, uploadError })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: 'Failed to upload file. Please try again.'
      }
    }

    // Get signed URL (valid for 1 year) - bucket is private, not public!
    const { data: urlData, error: urlError } = await supabase.storage
      .from('resume')
      .createSignedUrl(uploadData.path, 31536000) // 1 year = 365 days * 24 hours * 60 mins * 60 secs

    if (urlError || !urlData) {
      console.error('❌ Failed to create signed URL:', urlError)
      // Clean up uploaded file
      await supabase.storage.from('resume').remove([uploadData.path])
      return {
        success: false,
        error: 'Failed to create file URL. Please try again.'
      }
    }

    const signedUrl = urlData.signedUrl

    console.log('🔗 Signed URL created:', signedUrl)
    console.log('💾 Creating database record...')

    // Create database record
    const { data: resumeData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_url: signedUrl,
        file_name: file.name,
        file_size: file.size,
        parsing_status: 'pending'
      })
      .select()
      .single()

    console.log('💾 Database response:', { resumeData, dbError })

    if (dbError) {
      console.error('❌ Database error:', dbError)
      // Clean up uploaded file
      await supabase.storage.from('resume').remove([uploadData.path])
      return {
        success: false,
        error: 'Failed to save resume. Please try again.'
      }
    }

    console.log('✅ Upload complete!', { resumeId: resumeData.id, fileUrl: signedUrl })

    return {
      success: true,
      resumeId: resumeData.id,
      fileUrl: signedUrl
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    }
  }
}

/**
 * Get user's resumes
 */
export async function getUserResumes(userId: string) {
  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching resumes:', error)
    return []
  }

  return data
}

/**
 * Delete resume
 */
export async function deleteResume(resumeId: string, fileUrl: string) {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split('/resume/')
    const filePath = urlParts[1]

    // Delete from storage
    await supabase.storage.from('resume').remove([filePath])

    // Delete from database (cascade will handle related jobs)
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)

    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: 'Failed to delete resume' }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
