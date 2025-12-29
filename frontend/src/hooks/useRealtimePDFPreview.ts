import { useState, useEffect, useRef } from 'react'
import { usePDFExport } from './usePDFExport'
import { ContentBlock, LayoutDecision } from '../types/resume'

/**
 * Hook for real-time PDF preview with debouncing
 * Generates PDF in-memory (no upload to Supabase Storage)
 */
export function useRealtimePDFPreview(
  blocks: ContentBlock[],
  templateId: 'A' | 'B' | 'C' | 'D',
  layout: LayoutDecision | null
) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const { generatePDF } = usePDFExport()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const previousUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce PDF generation (500ms)
    debounceTimerRef.current = setTimeout(async () => {
      if (!blocks || blocks.length === 0 || !layout) {
        console.log('⚠️ [PDF Preview] Missing blocks or layout, skipping generation')
        return
      }

      console.log('🔄 [PDF Preview] Generating PDF with template', templateId)
      setIsGenerating(true)

      try {
        const blob = await generatePDF({
          templateId,
          blocks,
          layout,
        })

        if (!blob) {
          console.error('❌ [PDF Preview] generatePDF returned null')
          setIsGenerating(false)
          return
        }

        // Create object URL for in-memory preview (NO UPLOAD)
        const url = URL.createObjectURL(blob)
        console.log('✅ [PDF Preview] PDF generated, size:', blob.size, 'bytes')

        // Cleanup previous URL to avoid memory leaks
        if (previousUrlRef.current) {
          URL.revokeObjectURL(previousUrlRef.current)
        }

        setPdfUrl(url)
        previousUrlRef.current = url
      } catch (error) {
        console.error('❌ [PDF Preview] Error generating PDF:', error)
      } finally {
        setIsGenerating(false)
      }
    }, 500) // 500ms debounce

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, templateId, layout]) // generatePDF removed - it's stable from usePDFExport

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current)
      }
    }
  }, [])

  return { pdfUrl, isGenerating }
}
