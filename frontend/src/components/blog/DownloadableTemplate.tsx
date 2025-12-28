import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Download, FileText, Eye } from 'lucide-react'
import { analytics } from '../../lib/analytics'

interface DownloadableTemplateProps {
  jobTitle: string
  templates?: ('A' | 'B' | 'C' | 'D')[]
}

const templateDescriptions = {
  A: {
    name: 'Modern Single Column',
    description: 'Clean, professional layout with clear section hierarchy',
    icon: '📄',
  },
  B: {
    name: 'Professional Two Column',
    description: 'Sidebar layout highlighting skills and education',
    icon: '📋',
  },
  C: {
    name: 'Modern with Color',
    description: 'Eye-catching design with subtle color accents',
    icon: '🎨',
  },
  D: {
    name: 'Compact Dense',
    description: 'Maximum content in minimal space for experienced professionals',
    icon: '📊',
  },
}

export function DownloadableTemplate({ jobTitle, templates = ['A', 'B', 'C', 'D'] }: DownloadableTemplateProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<'A' | 'B' | 'C' | 'D'>(templates[0])

  const handleDownload = (format: 'PDF' | 'DOCX') => {
    // Track download event
    analytics.trackEvent('template_download', {
      job_title: jobTitle,
      template: selectedTemplate,
      format,
    })

    // Generate download URL
    const slug = jobTitle.toLowerCase().replace(/\s+/g, '-')
    const fileName = `${slug}-resume-template-${selectedTemplate}.${format.toLowerCase()}`
    const downloadUrl = `/downloads/${fileName}`

    // Trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreview = () => {
    // Open preview in new window or modal
    const slug = jobTitle.toLowerCase().replace(/\s+/g, '-')
    window.open(`/downloads/${slug}-resume-template-${selectedTemplate}-preview.pdf`, '_blank')
  }

  return (
    <Card className="p-6 my-8 border-2 border-[#2ec4b6]/20 bg-gradient-to-br from-white to-[#cbf3f0]/10">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-[#2ec4b6]" />
          <h3 className="text-xl font-heading font-bold text-gray-900">
            Download Free {jobTitle} Resume Template
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Choose a template style and download your customizable resume
        </p>
      </div>

      {/* Template Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {templates.map((template) => {
          const info = templateDescriptions[template]
          const isSelected = selectedTemplate === template
          return (
            <button
              key={template}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-[#2ec4b6] bg-[#cbf3f0]/30'
                  : 'border-gray-200 hover:border-[#2ec4b6]/50'
              }`}
            >
              <div className="text-3xl mb-2">{info.icon}</div>
              <div className="font-semibold text-sm text-gray-900 mb-1">
                Template {template}
              </div>
              <div className="text-xs text-gray-600">{info.name}</div>
            </button>
          )
        })}
      </div>

      {/* Selected Template Info */}
      <div className="mb-6 p-4 bg-white rounded-lg border">
        <h4 className="font-semibold text-gray-900 mb-2">
          {templateDescriptions[selectedTemplate].name}
        </h4>
        <p className="text-sm text-gray-600">
          {templateDescriptions[selectedTemplate].description}
        </p>
      </div>

      {/* Download Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button
          onClick={() => handleDownload('PDF')}
          className="bg-[#ff9f1c] hover:bg-[#ffbf69] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button
          onClick={() => handleDownload('DOCX')}
          variant="outline"
          className="border-[#2ec4b6] text-[#2ec4b6] hover:bg-[#cbf3f0]/30"
        >
          <Download className="w-4 h-4 mr-2" />
          Download DOCX
        </Button>
      </div>

      <Button
        onClick={handlePreview}
        variant="ghost"
        className="w-full text-gray-600 hover:text-[#2ec4b6]"
      >
        <Eye className="w-4 h-4 mr-2" />
        Preview Template
      </Button>

      {/* CTA */}
      <div className="mt-6 p-4 bg-gradient-to-r from-[#cbf3f0] to-[#ffbf69]/20 rounded-lg">
        <p className="text-sm text-gray-700 mb-3">
          Want an AI-tailored resume that matches your target job description?
        </p>
        <Button
          onClick={() => window.location.href = '/'}
          className="w-full bg-[#2ec4b6] hover:bg-[#2ec4b6]/90 text-white"
        >
          Try AI Resume Tailoring
        </Button>
      </div>
    </Card>
  )
}
