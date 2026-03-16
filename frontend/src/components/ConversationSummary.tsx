import { CheckCircle, Plus, Edit3, Trash2, Sparkles } from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

interface Change {
  section: string
  type: 'add' | 'edit' | 'remove'
  detail?: string
  original?: string
  updated?: string
}

interface ConversationSummaryProps {
  changes: Change[]
  summary: string
}

export function ConversationSummary({ changes, summary }: ConversationSummaryProps) {
  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <Plus className="w-4 h-4 text-green-600" />
      case 'edit':
        return <Edit3 className="w-4 h-4 text-blue-600" />
      case 'remove':
        return <Trash2 className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getChangeBadge = (type: string) => {
    switch (type) {
      case 'add':
        return <Badge className="bg-green-100 text-green-700 text-xs">Adding</Badge>
      case 'edit':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Editing</Badge>
      case 'remove':
        return <Badge className="bg-red-100 text-red-700 text-xs">Removing</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">Conversation Complete!</h3>
          <p className="text-sm text-gray-600">{summary}</p>
        </div>
      </div>

      {/* Changes */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-sm text-gray-900">Here's what I'm updating:</h4>
        </div>

        <div className="space-y-3">
          {changes.map((change, index) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getChangeIcon(change.type)}
                  <span className="font-medium text-sm text-gray-900">{change.section}</span>
                </div>
                {getChangeBadge(change.type)}
              </div>

              {change.type === 'add' && change.detail && (
                <div className="ml-6">
                  <p className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                    ✅ {change.detail}
                  </p>
                </div>
              )}

              {change.type === 'edit' && change.original && change.updated && (
                <div className="ml-6 space-y-1">
                  <p className="text-sm text-red-700 line-through bg-red-50 px-2 py-1 rounded">
                    ❌ {change.original}
                  </p>
                  <p className="text-sm text-green-700 bg-green-50 px-2 py-1 rounded">
                    ✅ {change.updated}
                  </p>
                </div>
              )}

              {change.type === 'remove' && change.detail && (
                <div className="ml-6">
                  <p className="text-sm text-red-700 line-through bg-red-50 px-2 py-1 rounded">
                    ❌ {change.detail}
                  </p>
                </div>
              )}

              {change.detail && (change.type !== 'edit' && change.type !== 'remove' && change.type !== 'add') && (
                <div className="ml-6">
                  <p className="text-sm text-gray-600">{change.detail}</p>
                </div>
              )}
            </div>
          ))}

          {changes.length === 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              No changes needed - your resume already covers the key requirements!
            </div>
          )}
        </div>
      </Card>

      {/* Auto-generating message */}
      <div className="text-center text-sm text-gray-600">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Generating your tailored resume...</span>
        </div>
      </div>
    </div>
  )
}
