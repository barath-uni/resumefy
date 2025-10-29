import { supabase } from './supabase'
import { pdf } from '@react-pdf/renderer'
import React from 'react'
import TemplateA from '../components/templates/TemplateA'

interface ContentBlock {
  id: string
  type: 'header' | 'section' | 'list' | 'text'
  category: 'contact' | 'experience' | 'education' | 'skills' | 'certifications' | 'projects' | 'custom'
  priority: number
  content: any
  metadata: {
    estimatedLines: number
    isOptional: boolean
    keywords: string[]
  }
}

interface LayoutDecision {
  templateName: string
  placement: {
    [blockId: string]: {
      section: 'main' | 'sidebar' | 'header'
      order: number
      fontSize: number
      maxLines?: number
    }
  }
  fits: boolean
  overflow: {
    hasOverflow: boolean
    overflowLines: number
    recommendations: string[]
  }
  warnings: string[]
}

export interface GeneratePDFResult {
  success: boolean
  pdfUrl?: string
  warnings?: string[]
  overflow?: {
    hasOverflow: boolean
    recommendations: string[]
  }
  error?: string
}

/**
 * Phase 3C: Generate PDF from resume blocks using intelligent template system
 *
 * This orchestrates the 3-step process:
 * 1. Extract flexible blocks (AI call #1)
 * 2. Decide layout (AI call #2)
 * 3. Render with React-PDF (no AI, $0 cost)
 *
 * Total cost: ~$0.015 per PDF
 */
export async function generatePDF(
  resumeId: string,
  templateName: string = 'Template A - Modern Single Column',
  jobDescriptionId: string = 'general' // For future: specific JD tailoring
): Promise<GeneratePDFResult> {
  try {
    console.log('🎨 [generatePDF] Starting PDF generation for resumeId:', resumeId)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ [generatePDF] User not authenticated:', userError)
      return {
        success: false,
        error: 'User not authenticated. Please sign in.'
      }
    }
    console.log('👤 [generatePDF] User:', user.email)

    // Step 1: Extract flexible blocks (AI call #1 - ~$0.01)
    console.log('📦 [generatePDF] Step 1: Extracting flexible blocks...')
    const { data: extractData, error: extractError } = await supabase.functions.invoke(
      'extract-resume-blocks',
      {
        body: { resumeId }
      }
    )

    if (extractError || !extractData.success) {
      console.error('❌ [generatePDF] Failed to extract blocks:', extractError || extractData.error)
      return {
        success: false,
        error: extractData?.error || extractError?.message || 'Failed to extract blocks'
      }
    }

    const blocks: ContentBlock[] = extractData.blocks

    console.log('✅ [generatePDF] Extracted', blocks.length, 'blocks')
    console.log('📊 [generatePDF] Detected categories:', extractData.detectedCategories)
    console.log('🎨 [generatePDF] Suggested template:', extractData.suggestedTemplate)

    // Step 2: Decide layout (AI call #2 - ~$0.005)
    console.log('🧠 [generatePDF] Step 2: Deciding layout...')
    const { data: layoutData, error: layoutError } = await supabase.functions.invoke(
      'decide-layout',
      {
        body: { resumeId, templateName }
      }
    )

    if (layoutError || !layoutData.success) {
      console.error('❌ [generatePDF] Failed to decide layout:', layoutError || layoutData.error)
      return {
        success: false,
        error: layoutData?.error || layoutError?.message || 'Failed to decide layout'
      }
    }

    const layout: LayoutDecision = layoutData.layout

    console.log('✅ [generatePDF] Layout decided')
    console.log('📐 [generatePDF] Fits in 1 page:', layout.fits)
    console.log('⚠️  [generatePDF] Has overflow:', layout.overflow.hasOverflow)
    if (layout.overflow.hasOverflow) {
      console.log('💡 [generatePDF] Recommendations:', layout.overflow.recommendations)
    }

    // Step 3: Render with React-PDF ($0 cost)
    console.log('📄 [generatePDF] Step 3: Rendering PDF with React-PDF...')

    // Create React-PDF document
    const pdfDocument = React.createElement(TemplateA, { blocks, layout })

    // Generate PDF blob
    const blob = await pdf(pdfDocument as any).toBlob()

    console.log('📦 [generatePDF] PDF blob generated, size:', blob.size, 'bytes')

    // Upload PDF to Supabase Storage - simple path for now
    const timestamp = Date.now()
    const fileName = `generated/${resumeId}_${timestamp}.pdf`

    console.log('📤 [generatePDF] Uploading PDF to bucket "resume", path:', fileName)
    console.log('📤 [generatePDF] User ID:', user.id)
    console.log('📤 [generatePDF] Blob type:', blob.type, 'size:', blob.size)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resume')
      .upload(fileName, blob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false, // Don't overwrite - create new version each time
      })

    if (uploadError) {
      console.error('❌ [generatePDF] Failed to upload PDF:', uploadError)
      console.error('❌ [generatePDF] Upload error details:', JSON.stringify(uploadError, null, 2))
      return {
        success: false,
        error: `Failed to upload generated PDF to storage: ${uploadError.message || JSON.stringify(uploadError)}`
      }
    }

    console.log('✅ [generatePDF] PDF uploaded successfully:', uploadData.path)

    // Get signed URL (valid for 1 year) - bucket is not public despite settings
    const { data: urlData, error: urlError } = await supabase.storage
      .from('resume')
      .createSignedUrl(uploadData.path, 31536000) // 1 year in seconds

    if (urlError || !urlData) {
      console.error('❌ [generatePDF] Failed to create signed URL:', urlError)
      return {
        success: false,
        error: 'Failed to create download URL for PDF'
      }
    }

    const pdfUrl = urlData.signedUrl

    console.log('🎉 [generatePDF] PDF generation complete!', pdfUrl)

    // Update database with generated PDF info
    await supabase
      .from('resumes')
      .update({
        parsing_status: 'pdf_generated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', resumeId)

    return {
      success: true,
      pdfUrl,
      warnings: layout.warnings,
      overflow: layout.overflow,
    }

  } catch (error: any) {
    console.error('❌ [generatePDF] Unexpected error:', error)
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    }
  }
}

/**
 * Download PDF locally (for testing)
 */
export async function downloadPDF(pdfUrl: string, fileName: string = 'resume.pdf') {
  try {
    const response = await fetch(pdfUrl)
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download PDF:', error)
  }
}
