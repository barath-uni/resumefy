import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { getTemplateComponent } from '../lib/templateRenderer'

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

interface UsePDFExportOptions {
  onSuccess?: (blob: Blob) => void
  onError?: (error: Error) => void
}

/**
 * usePDFExport Hook
 *
 * Generates PDF blob from template component using @react-pdf/renderer
 *
 * Usage:
 * ```tsx
 * const { generatePDF, isGenerating, error } = usePDFExport({
 *   onSuccess: (blob) => console.log('PDF generated!', blob),
 *   onError: (error) => console.error('Failed:', error)
 * })
 *
 * // Generate PDF
 * const blob = await generatePDF({
 *   templateId: 'B',
 *   blocks: tailoredBlocks,
 *   layout: layoutDecision
 * })
 * ```
 */
export function usePDFExport(options?: UsePDFExportOptions) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)

  /**
   * Generate PDF blob from template
   */
  const generatePDF = async (params: {
    templateId: 'A' | 'B' | 'C' | 'D'
    blocks: ContentBlock[]
    layout: LayoutDecision
  }): Promise<Blob | null> => {
    setIsGenerating(true)
    setError(null)
    setProgress(0)

    try {
      console.log('[usePDFExport] Starting PDF generation for template:', params.templateId)
      setProgress(20)

      // Get the template component
      const TemplateComponent = getTemplateComponent(params.templateId)
      console.log('[usePDFExport] Template component loaded')
      setProgress(40)

      // Create the PDF document element
      const documentElement = (
        <TemplateComponent
          blocks={params.blocks}
          layout={params.layout}
        />
      )
      console.log('[usePDFExport] Document element created')
      setProgress(60)

      // Generate PDF blob
      console.log('[usePDFExport] Generating PDF blob...')
      const blob = await pdf(documentElement).toBlob()
      console.log('[usePDFExport] PDF blob generated:', {
        size: blob.size,
        type: blob.type
      })
      setProgress(100)

      // Success callback
      if (options?.onSuccess) {
        options.onSuccess(blob)
      }

      setIsGenerating(false)
      return blob

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate PDF')
      console.error('[usePDFExport] Error generating PDF:', error)
      setError(error)

      // Error callback
      if (options?.onError) {
        options.onError(error)
      }

      setIsGenerating(false)
      return null
    }
  }

  /**
   * Download PDF directly (blob → download)
   */
  const downloadPDF = async (params: {
    templateId: 'A' | 'B' | 'C' | 'D'
    blocks: ContentBlock[]
    layout: LayoutDecision
    filename?: string
  }): Promise<boolean> => {
    const blob = await generatePDF(params)

    if (!blob) {
      return false
    }

    try {
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = params.filename || `resume-${params.templateId.toLowerCase()}.pdf`
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('[usePDFExport] PDF downloaded successfully')
      return true

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to download PDF')
      console.error('[usePDFExport] Error downloading PDF:', error)
      setError(error)

      if (options?.onError) {
        options.onError(error)
      }

      return false
    }
  }

  /**
   * Get PDF as data URL (useful for previews)
   */
  const getPDFDataURL = async (params: {
    templateId: 'A' | 'B' | 'C' | 'D'
    blocks: ContentBlock[]
    layout: LayoutDecision
  }): Promise<string | null> => {
    const blob = await generatePDF(params)

    if (!blob) {
      return null
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Failed to read PDF blob'))
      reader.readAsDataURL(blob)
    })
  }

  return {
    generatePDF,
    downloadPDF,
    getPDFDataURL,
    isGenerating,
    error,
    progress,
  }
}
