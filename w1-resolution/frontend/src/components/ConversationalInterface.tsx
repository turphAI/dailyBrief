import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from './ui/button'
import { Input } from './ui/input'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ConversationalInterfaceProps {
  resolutions: any[]
  setResolutions: (resolutions: any[]) => void
}

export default function ConversationalInterface({ 
  resolutions, 
  setResolutions 
}: ConversationalInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm here to help you track and achieve your resolutions. What would you like to work on today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      // Scroll to bottom smoothly
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 192) // max-height 48 (12rem) = 192px
      textarea.style.height = `${scrollHeight}px`
    }
  }, [input])

  // Helper function to get API URL based on environment
  const getApiUrl = (path: string) => {
    // If running on localhost, use local backend
    if (window.location.hostname === 'localhost') {
      return `http://localhost:3000${path}`
    }
    // If running on deployed version, use relative paths
    return path
  }

  // Fetch resolutions on component mount
  useEffect(() => {
    const fetchResolutions = async () => {
      try {
        const response = await fetch(getApiUrl('/api/w1?action=resolutions'))
        if (response.ok) {
          const data = await response.json()
          if (data.resolutions && Array.isArray(data.resolutions)) {
            setResolutions(data.resolutions)
          }
        }
      } catch (error) {
        console.error('Failed to fetch resolutions:', error)
      }
    }

    fetchResolutions()
  }, [])

  const handleSendMessage = async (e?: React.FormEvent | React.MouseEvent) => {
    try {
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault()
      }
      
      const messageText = input.trim()
      if (!messageText || isLoading) return

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: messageText,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsLoading(true)

      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          conversationId: conversationId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store conversation ID for future messages
        setConversationId(data.conversationId)

        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Update resolutions from response (includes all resolutions)
        if (data.resolutions && Array.isArray(data.resolutions)) {
          setResolutions(data.resolutions)
        } else if (data.resolutionUpdate) {
          // Fallback to single resolution update
          const existingIndex = resolutions.findIndex(r => r.id === data.resolutionUpdate.id)
          if (existingIndex >= 0) {
            const updated = [...resolutions]
            updated[existingIndex] = data.resolutionUpdate
            setResolutions(updated)
          } else {
            setResolutions([...resolutions, data.resolutionUpdate])
          }
        }
      } else {
        const errorText = await response.text()
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Message Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {message.type === 'user' ? (
                <p className="text-sm">{message.content}</p>
              ) : (
                <div className="text-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                      h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-3 mt-2" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-2" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="font-bold mb-2 mt-1" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 mb-3 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 mb-3 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-0 leading-relaxed" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      code: ({ node, ...props }) => <code className="bg-black bg-opacity-20 px-2 py-1 rounded text-xs font-mono" {...props} />,
                      blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-opacity-30 pl-3 italic mb-3" {...props} />,
                      a: ({ node, ...props }) => <a className="underline hover:opacity-80" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              <span className="text-xs opacity-70 mt-2 block">
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-4 py-2 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 space-y-3">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Send on Enter, but allow Shift+Enter for newlines
              if ((e.key === 'Enter' || e.key === 'Return') && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Tell me about your resolution... (Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            className="flex-1 min-h-10 max-h-48 w-full p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            rows={1}
            style={{
              height: '40px',
              overflow: 'hidden',
            }}
          />
          <Button
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-10 w-10"
            onClick={(e) => handleSendMessage(e as any)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Tip: Ask me to create, update, or delete resolutions. I'll help you stay focused with a maximum of 5 active resolutions.
        </p>
      </div>
    </div>
  )
}
