import { useState } from 'react'
import { templates, type Template } from '../lib/templateData'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Check, Sparkles } from 'lucide-react'

interface TemplatePickerProps {
  selectedTemplateId: string
  onTemplateSelect: (templateId: string) => void
  onConfirm: () => void
  isGenerating?: boolean
  compact?: boolean // Compact mode for 3-column layout
}

export default function TemplatePicker({
  selectedTemplateId,
  onTemplateSelect,
  onConfirm,
  isGenerating = false,
  compact = false
}: TemplatePickerProps) {
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0]

  // Compact mode: Just grid + button, no preview panel
  if (compact) {
    return (
      <Card className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">Choose Template</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Select a layout style for your resume
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {templates.map((template) => {
            const isSelected = template.id === selectedTemplateId

            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onTemplateSelect(template.id)}
              >
                <div className="relative aspect-[3/4] bg-muted/30 rounded-t-lg overflow-hidden border-b border-border">
                  <img
                    src={template.previewThumb}
                    alt={`${template.name} preview`}
                    className="w-full h-full object-cover"
                  />

                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-foreground truncate">
                      {template.name}
                    </h4>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      {template.atsScore}%
                    </Badge>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <Button
          onClick={onConfirm}
          disabled={isGenerating || !selectedTemplateId}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Resume
            </>
          )}
        </Button>
      </Card>
    )
  }

  // Full mode: Grid + Preview panel side-by-side
  return (
    <div className="space-y-6">
      {/* Template Grid and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Template Grid Selector */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground">Choose a Template</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Select the layout that best fits your style
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {templates.map((template) => {
              const isSelected = template.id === selectedTemplateId

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? 'ring-2 ring-primary border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => onTemplateSelect(template.id)}
                >
                  {/* Preview Thumbnail */}
                  <div className="relative aspect-[3/4] bg-muted/30 rounded-t-lg overflow-hidden border-b border-border">
                    <img
                      src={template.previewThumb}
                      alt={`${template.name} preview`}
                      className="w-full h-full object-cover"
                    />

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-medium text-foreground leading-tight">
                        {template.name}
                      </h4>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                        {template.atsScore}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.layout.replace('-', ' ')}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Right: Large Preview */}
        <div className="lg:col-span-3">
          <Card className="lg:sticky lg:top-4 overflow-hidden">
            <ScrollArea className="h-[600px]">
              {/* Large Preview Image */}
              <div className="aspect-[8.5/11] bg-muted/30 relative flex items-center justify-center p-8">
                <img
                  src={selectedTemplate.previewFull}
                  alt={`${selectedTemplate.name} full preview`}
                  className="max-w-full max-h-full object-contain shadow-lg rounded-sm"
                />
              </div>

              {/* Template Details */}
              <div className="p-6 border-t border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <Badge variant="default" className="ml-4 whitespace-nowrap">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {selectedTemplate.atsScore}% ATS
                  </Badge>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Features
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.features.map((feature, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={onConfirm}
          disabled={isGenerating}
          size="lg"
          className="min-w-[200px]"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Resume
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
