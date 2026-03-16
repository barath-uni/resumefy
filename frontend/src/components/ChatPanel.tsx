import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, CheckCircle, Download, Mail } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { ChatMessage } from './ChatMessage'
import { TemplateSwitcher } from './TemplateSwitcher'
import { ConversationSummary } from './ConversationSummary'
import { supabase } from '../lib/supabase'
import { toast } from '../hooks/use-toast'

interface Job {
  id: string
  job_title: string
  conversation_status: string
  conversation_history?: any[]
  gaps_identified?: any[]
  match_score_initial?: number
  match_score_final?: number
  pdf_url?: string
  current_question_index?: number
}

interface ChatPanelProps {
  job: Job
  onClose: () => void
  onJobUpdated: () => void
}

export function ChatPanel({ job, onClose, onJobUpdated }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 10 })
  const [gaps, setGaps] = useState<any[]>([])
  const [isDone, setIsDone] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [conversationSummary, setConversationSummary] = useState<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Load conversation history
    if (job.conversation_history) {
      setMessages(job.conversation_history)
    }

    if (job.gaps_identified) {
      setGaps(job.gaps_identified)
    }

    if (job.current_question_index !== undefined) {
      setProgress({ current: job.current_question_index + 1, total: 5 })
    }

    setIsDone(job.conversation_status === 'ready' || job.conversation_status === 'processing')
  }, [job])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return

    const userMessage = currentInput.trim()
    setCurrentInput('')
    setIsLoading(true)

    // Add user message optimistically
    const optimisticMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMessage])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interrogator-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'answer',
          jobId: job.id,
          userAnswer: userMessage
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to process answer')
      }

      // Update progress
      if (result.progress) {
        setProgress(result.progress)
      }

      // If done, show summary and auto-generate PDF
      if (result.done && result.summary) {
        setIsDone(true)
        setConversationSummary(result.summary)

        // Auto-generate PDF in parallel (don't wait)
        handleGeneratePDF()

        onJobUpdated()
      } else if (result.question) {
        // Add AI's next question
        setMessages(prev => [...prev, {
          role: 'ai',
          content: result.question,
          timestamp: new Date().toISOString()
        }])

        onJobUpdated()
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive'
      })

      // Remove optimistic message
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interrogator-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'generate',
          jobId: job.id
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF')
      }

      toast({
        title: 'Success!',
        description: `Your resume is ready! Match score improved by ${result.matchScoreImprovement?.improvement}%`
      })

      setShowTemplates(true)
      onJobUpdated()
    } catch (error: any) {
      console.error('Error generating PDF:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate PDF',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const isReadOnly = job.conversation_status === 'ready' || job.conversation_status === 'processing'

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">{job.job_title}</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Message {progress.current}/{progress.total}</span>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        i < progress.current ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {job.match_score_initial && (
                <span className="text-sm text-gray-600">
                  Match: {job.match_score_initial}%
                  {job.match_score_final && (
                    <span className="text-green-600 font-semibold ml-1">
                      → {job.match_score_final}%
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Gaps Section */}
        {gaps.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b">
            <p className="text-sm font-medium text-gray-700 mb-2">📍 Gaps Identified:</p>
            <div className="flex flex-wrap gap-2">
              {gaps.map((gap, i) => (
                <Badge
                  key={i}
                  variant={gap.answered ? 'secondary' : 'default'}
                  className={gap.answered ? 'line-through opacity-60' : ''}
                >
                  {gap.gap}
                  {gap.answered && <CheckCircle className="w-3 h-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}

          {/* Conversation Summary (shown when done) */}
          {conversationSummary && (
            <div className="mb-6">
              <ConversationSummary
                changes={conversationSummary.changes || []}
                summary={conversationSummary.summary || 'Updating your resume...'}
              />
            </div>
          )}

          {isLoading && (
            <div className="flex gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-600">AI is thinking...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Template Switcher (shown after PDF generation) */}
        {showTemplates && job.pdf_url && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <TemplateSwitcher jobId={job.id} currentPdfUrl={job.pdf_url} />
          </div>
        )}

        {/* Input Area */}
        {!isReadOnly && !isDone && (
          <div className="px-6 py-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={inputRef}
                placeholder="Type your answer... (Shift+Enter for new line)"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                rows={2}
                className="flex-1 resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !currentInput.trim()}
                size="icon"
                className="h-auto"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Be specific! The more details you provide, the better your tailored resume will be.
            </p>
          </div>
        )}

        {/* Generate PDF Button */}
        {isDone && !job.pdf_url && (
          <div className="px-6 py-4 border-t">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating your resume...
                </>
              ) : (
                'Generate Tailored Resume'
              )}
            </Button>
          </div>
        )}

        {/* Download/Email Actions */}
        {job.pdf_url && !showTemplates && (
          <div className="px-6 py-4 border-t flex gap-3">
            <Button variant="outline" className="flex-1" asChild>
              <a href={job.pdf_url} download>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </Button>
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-2" />
              Email PDF
            </Button>
            <Button onClick={() => setShowTemplates(true)}>
              Try Other Templates
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
