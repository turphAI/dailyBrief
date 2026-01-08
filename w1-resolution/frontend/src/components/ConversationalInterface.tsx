import { useState } from 'react'
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const messageText = input.trim()
    if (!messageText || isLoading) return

    console.log('[Chat] Sending message:', messageText)

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

    try {
      console.log('[Chat] Fetching from API...', { url: 'http://localhost:3000/api/chat' })
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText,
          conversationId: conversationId
        })
      })

      console.log('[Chat] Response received:', { status: response.status })

      if (response.ok) {
        const data = await response.json()
        
        console.log('[Chat] Response data:', { 
          hasResponse: !!data.response,
          toolsUsed: data.toolsUsed,
          conversationId: data.conversationId
        })

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

        // If a resolution was created or updated, update state
        if (data.resolutionUpdate) {
          console.log('[Chat] Resolution updated:', data.resolutionUpdate.title)
          // Check if it's an update to existing resolution
          const existingIndex = resolutions.findIndex(r => r.id === data.resolutionUpdate.id)
          if (existingIndex >= 0) {
            const updated = [...resolutions]
            updated[existingIndex] = data.resolutionUpdate
            setResolutions(updated)
          } else {
            // New resolution
            setResolutions([...resolutions, data.resolutionUpdate])
          }
        }
      } else {
        const errorText = await response.text()
        console.error('[Chat] API error response:', errorText)
        throw new Error(`API returned ${response.status}`)
      }
    } catch (error) {
      console.error('[Chat] Failed to send message:', error)
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      code: ({ node, ...props }) => <code className="bg-opacity-20 bg-white px-1 rounded" {...props} />,
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
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me about your resolution..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          💡 Tip: Ask me to create, update, or delete resolutions. I'll help you stay focused with a maximum of 5 active resolutions.
        </p>
      </div>
    </div>
  )
}
