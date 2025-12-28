import { Card } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

interface UniversalObjectEditorProps {
  data: Record<string, any>
  onChange: (newData: Record<string, any>) => void
  title?: string
  isNested?: boolean
}

/**
 * Universal Object Editor
 *
 * Dynamically renders form fields for ANY object structure
 * - Detects field types automatically
 * - Handles strings, arrays, nested objects
 * - No hardcoded field names
 */
export function UniversalObjectEditor({
  data,
  onChange,
  title,
  isNested = false
}: UniversalObjectEditorProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedFields)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedFields(newExpanded)
  }

  const updateField = (key: string, value: any) => {
    onChange({ ...data, [key]: value })
  }

  const addArrayItem = (key: string) => {
    const currentArray = Array.isArray(data[key]) ? data[key] : []
    updateField(key, [...currentArray, ''])
  }

  const updateArrayItem = (key: string, index: number, value: string) => {
    const currentArray = [...(data[key] || [])]
    currentArray[index] = value
    updateField(key, currentArray)
  }

  const removeArrayItem = (key: string, index: number) => {
    const currentArray = [...(data[key] || [])]
    currentArray.splice(index, 1)
    updateField(key, currentArray)
  }

  const renderFieldEditor = (key: string, value: any) => {
    // 1. Array of strings (bullets, technologies, etc.)
    if (Array.isArray(value) && value.every(v => typeof v === 'string' || v === null || v === undefined)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={() => addArrayItem(key)}
              className="h-6 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Textarea
                  value={item || ''}
                  onChange={(e) => updateArrayItem(key, index, e.target.value)}
                  placeholder={`${key} ${index + 1}`}
                  rows={2}
                  className="text-sm flex-1"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeArrayItem(key, index)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  <X className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            {value.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                No items yet. Click "Add" to add items.
              </p>
            )}
          </div>
        </div>
      )
    }

    // 2. Nested object (recursive)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const isExpanded = expandedFields.has(key)
      return (
        <div className="space-y-2">
          <button
            onClick={() => toggleExpand(key)}
            className="text-xs font-medium text-muted-foreground capitalize hover:text-foreground transition-colors flex items-center gap-1"
          >
            {isExpanded ? '▼' : '▶'} {key.replace(/([A-Z])/g, ' $1').trim()}
          </button>
          {isExpanded && (
            <div className="pl-4 border-l-2 border-border space-y-3">
              <UniversalObjectEditor
                data={value}
                onChange={(newValue) => updateField(key, newValue)}
                isNested={true}
              />
            </div>
          )}
        </div>
      )
    }

    // 3. String (detect if it's long text or short)
    if (typeof value === 'string') {
      const isLongText = value.length > 100 || value.includes('\n')

      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          {isLongText ? (
            <Textarea
              value={value}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder={`Enter ${key}...`}
              rows={4}
              className="text-sm"
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => updateField(key, e.target.value)}
              placeholder={`Enter ${key}...`}
              className="text-sm"
            />
          )}
        </div>
      )
    }

    // 4. Number
    if (typeof value === 'number') {
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <Input
            type="number"
            value={value}
            onChange={(e) => updateField(key, parseFloat(e.target.value) || 0)}
            placeholder={`Enter ${key}...`}
            className="text-sm"
          />
        </div>
      )
    }

    // 5. Boolean
    if (typeof value === 'boolean') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateField(key, e.target.checked)}
            className="w-4 h-4"
          />
          <label className="text-xs font-medium text-muted-foreground capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
        </div>
      )
    }

    // 6. Fallback - convert to string
    return (
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </label>
        <Input
          value={String(value)}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={`Enter ${key}...`}
          className="text-sm"
        />
      </div>
    )
  }

  const Container = isNested ? 'div' : Card

  return (
    <Container className={isNested ? 'space-y-3' : 'p-4 bg-muted/30 space-y-3'}>
      {title && !isNested && (
        <h4 className="text-sm font-medium text-foreground mb-3">{title}</h4>
      )}

      {Object.entries(data).map(([key, value]) => (
        <div key={key}>
          {renderFieldEditor(key, value)}
        </div>
      ))}

      {Object.keys(data).length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No fields to edit
        </p>
      )}
    </Container>
  )
}
