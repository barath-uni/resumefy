import { Bot, User } from 'lucide-react'

interface ChatMessageProps {
  role: 'ai' | 'user'
  content: string
  timestamp?: string
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isAI = role === 'ai'

  return (
    <div className={`flex gap-3 mb-6 ${isAI ? '' : 'justify-end'}`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Bot className="w-5 h-5 text-blue-600" />
        </div>
      )}

      <div
        className={`flex-1 max-w-[80%] ${
          isAI
            ? 'bg-gray-100 rounded-lg p-4'
            : 'bg-blue-600 text-white rounded-lg p-4'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        {timestamp && (
          <p className={`text-xs mt-2 ${isAI ? 'text-gray-500' : 'text-blue-100'}`}>
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {!isAI && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  )
}
