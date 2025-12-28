import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Plus, X } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ContentBlock } from '../../types/resume'

interface ExperienceEntry {
  title?: string
  position?: string
  company: string
  startDate?: string
  endDate?: string
  location?: string
  bullets?: string[]
  description?: string
}

interface ExperienceEditorProps {
  block: ContentBlock
  onUpdate: (updatedBlock: ContentBlock) => void
}

export function ExperienceEditor({ block, onUpdate }: ExperienceEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const experiences: ExperienceEntry[] = Array.isArray(block.content) ? block.content : []

  const updateExperience = (index: number, field: keyof ExperienceEntry, value: any) => {
    const newExperiences = [...experiences]
    newExperiences[index] = { ...newExperiences[index], [field]: value }
    onUpdate({ ...block, content: newExperiences })
  }

  const addBullet = (expIndex: number) => {
    const newExperiences = [...experiences]
    const bullets = newExperiences[expIndex].bullets || []
    newExperiences[expIndex] = {
      ...newExperiences[expIndex],
      bullets: [...bullets, '']
    }
    onUpdate({ ...block, content: newExperiences })
  }

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const newExperiences = [...experiences]
    const bullets = [...(newExperiences[expIndex].bullets || [])]
    bullets[bulletIndex] = value
    newExperiences[expIndex] = { ...newExperiences[expIndex], bullets }
    onUpdate({ ...block, content: newExperiences })
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newExperiences = [...experiences]
    const bullets = [...(newExperiences[expIndex].bullets || [])]
    bullets.splice(bulletIndex, 1)
    newExperiences[expIndex] = { ...newExperiences[expIndex], bullets }
    onUpdate({ ...block, content: newExperiences })
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden">
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              {block.category}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({experiences.length} {experiences.length === 1 ? 'entry' : 'entries'})
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {experiences.map((exp, index) => (
              <Card key={index} className="p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Entry {index + 1}
                  </span>
                </div>

                {/* Title/Position */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Job Title
                  </label>
                  <Input
                    value={exp.title || exp.position || ''}
                    onChange={(e) => updateExperience(index, 'title', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="text-sm"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Company
                  </label>
                  <Input
                    value={exp.company || ''}
                    onChange={(e) => updateExperience(index, 'company', e.target.value)}
                    placeholder="e.g., Google"
                    className="text-sm"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Start Date
                    </label>
                    <Input
                      value={exp.startDate || ''}
                      onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                      placeholder="e.g., Jan 2020"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      End Date
                    </label>
                    <Input
                      value={exp.endDate || ''}
                      onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                      placeholder="e.g., Present"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Location (optional) */}
                {exp.location !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Location
                    </label>
                    <Input
                      value={exp.location || ''}
                      onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Bullets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Achievements & Responsibilities
                    </label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addBullet(index)}
                      className="h-6 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Point
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {(exp.bullets || []).map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="flex gap-2">
                        <Textarea
                          value={bullet}
                          onChange={(e) => updateBullet(index, bulletIndex, e.target.value)}
                          placeholder="e.g., Led team of 5 engineers..."
                          rows={2}
                          className="text-sm flex-1"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeBullet(index, bulletIndex)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {(!exp.bullets || exp.bullets.length === 0) && (
                      <p className="text-xs text-muted-foreground italic">
                        No bullet points yet. Click "Add Point" to add achievements.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {experiences.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No experience entries found
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
