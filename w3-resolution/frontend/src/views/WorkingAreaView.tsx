import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquarePlus, X } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import ThreadPanel from '../components/ThreadPanel'
import axios from 'axios'
import type { ResearchSession, Message, ConversationThread } from '../types'

interface WorkingAreaViewProps {
  session: ResearchSession
  updateSession: (updates: Partial<ResearchSession>) => void
  onRegenerateDocument: () => Promise<void>
}

export default function WorkingAreaView({
  session,
  updateSession,
  onRegenerateDocument
}: WorkingAreaViewProps) {
  // Initialize messages if not exists
  const messages = session.messages || [
    {
      id: '1',
      role: 'assistant' as const,
      content: `Hi! I'm here to help you research **${session.topic}**. Ask me anything, and I'll help you explore this topic in depth.`,
      timestamp: new Date().toISOString()
    }
  ]

  const threads = session.threads || []
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzingThreadId, setAnalyzingThreadId] = useState<string>()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const [showThreadInput, setShowThreadInput] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 192)
      textarea.style.height = `${scrollHeight}px`
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    // Update session with new message
    updateSession({
      messages: [...messages, userMessage]
    })

    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/w3?action=research', {
        topic: session.topic,
        question: userMessage.content,
        context: messages.slice(-5).map(m => ({
          role: m.role,
          content: m.content
        }))
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date().toISOString()
      }

      // If there's an active thread, add these message IDs to it
      let updatedThreads = threads
      if (activeThreadId) {
        updatedThreads = threads.map(t =>
          t.id === activeThreadId
            ? {
                ...t,
                messageIds: [...t.messageIds, userMessage.id, assistantMessage.id]
              }
            : t
        )
      }

      // Add assistant message and query to session
      updateSession({
        messages: [...messages, userMessage, assistantMessage],
        threads: updatedThreads,
        queries: [{
          id: Date.now().toString(),
          question: userMessage.content,
          response: response.data.response,
          timestamp: new Date().toISOString(),
          category: response.data.category,
          sources: response.data.sources
        }, ...session.queries]
      })
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      }
      updateSession({
        messages: [...messages, userMessage, errorMessage]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateThread = (title: string, messageIds: string[]) => {
    const newThread: ConversationThread = {
      id: Date.now().toString(),
      title,
      messageIds,
      createdAt: new Date().toISOString(),
      status: 'draft'
    }

    updateSession({
      threads: [...threads, newThread]
    })
  }

  const handleStartNewThread = () => {
    if (!newThreadTitle.trim()) return

    const newThread: ConversationThread = {
      id: Date.now().toString(),
      title: newThreadTitle.trim(),
      messageIds: [],
      createdAt: new Date().toISOString(),
      status: 'draft'
    }

    updateSession({
      threads: [...threads, newThread]
    })

    setActiveThreadId(newThread.id)
    setNewThreadTitle('')
    setShowThreadInput(false)
  }

  const handleEndThread = () => {
    setActiveThreadId(null)
  }

  const activeThread = activeThreadId ? threads.find(t => t.id === activeThreadId) : null

  const handleAnalyzeThread = async (threadId: string) => {
    const thread = threads.find(t => t.id === threadId)
    if (!thread) return

    setAnalyzingThreadId(threadId)

    try {
      const threadMessages = thread.messageIds
        .map(id => messages.find(m => m.id === id))
        .filter(Boolean)

      const response = await axios.post('/api/w3?action=analyze-thread', {
        sessionId: session.id,
        threadId,
        messages: threadMessages,
        existingDocument: '' // We'll fetch this from the document view later
      })

      // Update thread with analysis
      updateSession({
        threads: threads.map(t =>
          t.id === threadId
            ? {
                ...t,
                summary: response.data.summary,
                documentImpact: {
                  section: response.data.targetSection || 'New Section',
                  preview: response.data.proposedContent
                }
              }
            : t
        )
      })
    } catch (error) {
      console.error('Failed to analyze thread:', error)
    } finally {
      setAnalyzingThreadId(undefined)
    }
  }

  const handleApplyThread = async (threadId: string) => {
    const thread = threads.find(t => t.id === threadId)
    if (!thread || !thread.documentImpact) return

    try {
      await axios.post('/api/w3?action=apply-thread', {
        sessionId: session.id,
        threadId,
        proposedContent: thread.documentImpact.preview
      })

      // Mark thread as applied
      updateSession({
        threads: threads.map(t =>
          t.id === threadId
            ? {
                ...t,
                status: 'applied' as const,
                appliedAt: new Date().toISOString()
              }
            : t
        )
      })

      // Regenerate document
      await onRegenerateDocument()
    } catch (error) {
      console.error('Failed to apply thread:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex bg-background">
      {/* Chat Area (Left) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs opacity-70 mt-2">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Active Thread Indicator */}
            {activeThread && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded px-3 py-2">
                <MessageSquarePlus className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium flex-1">
                  Adding to thread: <span className="text-primary">{activeThread.title}</span>
                </span>
                <Button
                  onClick={handleEndThread}
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2"
                >
                  <X className="w-4 h-4" />
                  End Thread
                </Button>
              </div>
            )}

            {/* New Thread Input */}
            {showThreadInput && (
              <div className="flex items-center gap-2 bg-muted/50 border rounded px-3 py-2">
                <Input
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="Thread title..."
                  className="flex-1 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleStartNewThread()
                    } else if (e.key === 'Escape') {
                      setShowThreadInput(false)
                      setNewThreadTitle('')
                    }
                  }}
                  autoFocus
                />
                <Button
                  onClick={handleStartNewThread}
                  disabled={!newThreadTitle.trim()}
                  size="sm"
                  className="h-8"
                >
                  Start
                </Button>
                <Button
                  onClick={() => {
                    setShowThreadInput(false)
                    setNewThreadTitle('')
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about this topic... (Enter to send, Shift+Enter for new line)"
                  disabled={loading}
                  className="resize-none min-h-[60px] max-h-48"
                  rows={1}
                />
              </div>
              {!activeThread && !showThreadInput && (
                <Button
                  onClick={() => setShowThreadInput(true)}
                  variant="outline"
                  size="icon"
                  className="h-[60px] w-[60px]"
                  title="Start a new thread"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Your conversation automatically updates your research queries
              {activeThread && <span className="text-primary font-medium"> and the active thread</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Thread Panel (Right) */}
      <div className="w-80 flex-shrink-0">
        <ThreadPanel
          threads={threads}
          messages={messages}
          onCreateThread={handleCreateThread}
          onAnalyzeThread={handleAnalyzeThread}
          onApplyThread={handleApplyThread}
          analyzingThreadId={analyzingThreadId}
        />
      </div>
    </div>
  )
}
