import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { ContentBlock } from '../../types/resume'

interface EducationEntry {
  degree: string
  school?: string
  institution?: string
  graduationDate?: string
  gradDate?: string
  gpa?: string
  location?: string
  honors?: string
}

interface EducationEditorProps {
  block: ContentBlock
  onUpdate: (updatedBlock: ContentBlock) => void
}

export function EducationEditor({ block, onUpdate }: EducationEditorProps) {
  const [isOpen, setIsOpen] = useState(true)
  const education: EducationEntry[] = Array.isArray(block.content) ? block.content : []

  const updateEducation = (index: number, field: keyof EducationEntry, value: any) => {
    const newEducation = [...education]
    newEducation[index] = { ...newEducation[index], [field]: value }
    onUpdate({ ...block, content: newEducation })
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
              ({education.length} {education.length === 1 ? 'entry' : 'entries'})
            </span>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {education.map((edu, index) => (
              <Card key={index} className="p-4 bg-muted/30 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Entry {index + 1}
                  </span>
                </div>

                {/* Degree */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Degree
                  </label>
                  <Input
                    value={edu.degree || ''}
                    onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                    placeholder="e.g., Bachelor of Science in Computer Science"
                    className="text-sm"
                  />
                </div>

                {/* School/Institution */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    School
                  </label>
                  <Input
                    value={edu.school || edu.institution || ''}
                    onChange={(e) => updateEducation(index, 'school', e.target.value)}
                    placeholder="e.g., Stanford University"
                    className="text-sm"
                  />
                </div>

                {/* Graduation Date & GPA */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Graduation Date
                    </label>
                    <Input
                      value={edu.graduationDate || edu.gradDate || ''}
                      onChange={(e) => updateEducation(index, 'graduationDate', e.target.value)}
                      placeholder="e.g., May 2020"
                      className="text-sm"
                    />
                  </div>
                  {(edu.gpa !== undefined || edu.gpa === '') && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        GPA
                      </label>
                      <Input
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                        placeholder="e.g., 3.8/4.0"
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Location (optional) */}
                {edu.location !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Location
                    </label>
                    <Input
                      value={edu.location || ''}
                      onChange={(e) => updateEducation(index, 'location', e.target.value)}
                      placeholder="e.g., Palo Alto, CA"
                      className="text-sm"
                    />
                  </div>
                )}

                {/* Honors (optional) */}
                {edu.honors !== undefined && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Honors
                    </label>
                    <Input
                      value={edu.honors || ''}
                      onChange={(e) => updateEducation(index, 'honors', e.target.value)}
                      placeholder="e.g., Summa Cum Laude"
                      className="text-sm"
                    />
                  </div>
                )}
              </Card>
            ))}

            {education.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No education entries found
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
