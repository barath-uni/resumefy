import { supabase } from './supabase'

interface UploadPDFParams {
  blob: Blob
  jobId: string
  userId: string
  templateId: 'A' | 'B' | 'C' | 'D'
}

interface UploadPDFResult {
  success: boolean
  pdfUrl?: string
  error?: string
}

/**
 * PDF Upload Service
 *
 * Handles uploading generated PDF blobs to Supabase storage
 * and updating job records with the PDF URL
 *
 * Storage Structure:
 * - Bucket: 'resume-pdfs' (or existing bucket name)
 * - Path: `{userId}/{jobId}/resume-{templateId}.pdf`
 */

/**
 * Upload PDF blob to Supabase storage
 */
export async function uploadPDFToStorage(params: UploadPDFParams): Promise<UploadPDFResult> {
  const { blob, jobId, userId, templateId } = params

  try {
    console.log('[pdfUploadService] Starting PDF upload:', {
      jobId,
      userId,
      templateId,
      blobSize: blob.size
    })

    // Create file path
    const fileName = `resume-${templateId.toLowerCase()}-${Date.now()}.pdf`
    const filePath = `${userId}/${jobId}/${fileName}`

    console.log('[pdfUploadService] Uploading to path:', filePath)

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('resume')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true, // Replace if exists
      })

    if (error) {
      console.error('[pdfUploadService] Upload error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    console.log('[pdfUploadService] Upload successful:', data)

    // Get signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('resume')
      .createSignedUrl(filePath, 31536000)

    if (urlError || !urlData) {
      console.error('[pdfUploadService] Failed to create signed URL:', urlError)
      return {
        success: false,
        error: urlError?.message || 'Failed to create signed URL'
      }
    }

    const pdfUrl = urlData.signedUrl

    console.log('[pdfUploadService] Signed URL generated:', pdfUrl)

    return {
      success: true,
      pdfUrl
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during upload'
    console.error('[pdfUploadService] Unexpected error:', err)

    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Update job record with PDF URL
 */
export async function updateJobWithPDF(params: {
  jobId: string
  pdfUrl: string
  templateId: 'A' | 'B' | 'C' | 'D'
}): Promise<boolean> {
  const { jobId, pdfUrl, templateId } = params

  try {
    console.log('[pdfUploadService] Updating job record:', {
      jobId,
      templateId
    })

    const { error } = await supabase
      .from('jobs')
      .update({
        pdf_url: pdfUrl,
        template_used: templateId
      })
      .eq('id', jobId)

    if (error) {
      console.error('[pdfUploadService] Job update error:', error)
      return false
    }

    console.log('[pdfUploadService] Job record updated successfully')
    return true

  } catch (err) {
    console.error('[pdfUploadService] Unexpected error updating job:', err)
    return false
  }
}

/**
 * Complete PDF generation flow:
 * 1. Upload PDF to storage
 * 2. Update job record with URL
 */
export async function completePDFGeneration(params: UploadPDFParams): Promise<UploadPDFResult> {
  console.log('[pdfUploadService] Starting complete PDF generation flow')

  // Step 1: Upload to storage
  const uploadResult = await uploadPDFToStorage(params)

  if (!uploadResult.success || !uploadResult.pdfUrl) {
    return uploadResult
  }

  // Step 2: Update job record
  const updateSuccess = await updateJobWithPDF({
    jobId: params.jobId,
    pdfUrl: uploadResult.pdfUrl,
    templateId: params.templateId
  })

  if (!updateSuccess) {
    return {
      success: false,
      error: 'Failed to update job record after upload'
    }
  }

  console.log('[pdfUploadService] Complete PDF generation flow successful')

  return {
    success: true,
    pdfUrl: uploadResult.pdfUrl
  }
}

/**
 * Delete PDF from storage (cleanup)
 */
export async function deletePDF(params: {
  userId: string
  jobId: string
  templateId: 'A' | 'B' | 'C' | 'D'
}): Promise<boolean> {
  try {
    const { userId, jobId, templateId } = params
    const fileName = `resume-${templateId.toLowerCase()}.pdf`
    const filePath = `${userId}/${jobId}/${fileName}`

    console.log('[pdfUploadService] Deleting PDF:', filePath)

    const { error } = await supabase.storage
      .from('resume')
      .remove([filePath])

    if (error) {
      console.error('[pdfUploadService] Delete error:', error)
      return false
    }

    console.log('[pdfUploadService] PDF deleted successfully')
    return true

  } catch (err) {
    console.error('[pdfUploadService] Unexpected error deleting PDF:', err)
    return false
  }
}
