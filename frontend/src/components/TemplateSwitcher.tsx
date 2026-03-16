import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Download, Mail, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { toast } from '../hooks/use-toast'

interface TemplateSwitcherProps {
  jobId: string
  currentPdfUrl: string
}

const templates = [
  { id: 'A', name: 'Modern Single Column', description: 'Clean and professional' },
  { id: 'B', name: 'Professional Two Column', description: 'Sidebar layout' },
  { id: 'C', name: 'Modern with Color', description: 'Blue accent header' },
  { id: 'D', name: 'Compact Dense', description: 'Maximizes space' }
]

export function TemplateSwitcher({ jobId, currentPdfUrl }: TemplateSwitcherProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('A')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [pdfUrl, setPdfUrl] = useState(currentPdfUrl)

  const handleTemplateChange = async (templateId: string) => {
    if (templateId === selectedTemplate) return

    setIsRegenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      // Call generate-tailored-resume with new template
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-tailored-resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          jobId: jobId,
          templateName: templateId,
          returnContentOnly: false
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to regenerate PDF')
      }

      setSelectedTemplate(templateId)
      setPdfUrl(result.pdfUrl)

      toast({
        title: 'Success',
        description: `Resume regenerated with Template ${templateId}`
      })
    } catch (error: any) {
      console.error('Error regenerating PDF:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate PDF',
        variant: 'destructive'
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Choose Template</h3>
        <div className="grid grid-cols-4 gap-2">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateChange(template.id)}
              disabled={isRegenerating}
              className={`p-3 border-2 rounded-lg text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isRegenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-xs">
                  {template.id}
                </Badge>
                {selectedTemplate === template.id && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900">{template.name}</p>
              <p className="text-xs text-gray-500 mt-1">{template.description}</p>
            </button>
          ))}
        </div>
      </div>

      {isRegenerating && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Regenerating with Template {selectedTemplate}...
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" asChild>
          <a href={pdfUrl} download>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </a>
        </Button>
        <Button variant="outline" className="flex-1">
          <Mail className="w-4 h-4 mr-2" />
          Email PDF
        </Button>
      </div>
    </div>
  )
}
