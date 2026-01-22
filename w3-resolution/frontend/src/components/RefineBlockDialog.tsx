import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from './ui/sheet'
import { ScrollArea } from './ui/scroll-area'
import { Loader2, Send, Check } from 'lucide-react'
import axios from 'axios'
import type { WorkingBlock } from '../types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  canApply?: boolean // For assistant messages, indicates if content can be applied
}

interface RefineBlockDialogProps {
  block: WorkingBlock | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateContent: (content: string) => void
  sessionId: string
  topic: string
}

export default function RefineBlockDialog({
  block,
  open,
  onOpenChange,
  onUpdateContent,
  sessionId,
  topic
}: RefineBlockDialogProps) {
  const [currentContent, setCurrentContent] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (block && open) {
      setCurrentContent(block.content)
      setMessages([])
      setInput('')
    }
  }, [block, open])

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  if (!block) return null

  const handleSend = async () => {
    if (!input.trim() || sending) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setSending(true)

    try {
      const response = await axios.post('/api/w3?action=refine-block', {
        sessionId,
        blockId: block.id,
        topic,
        currentContent,
        userMessage,
        conversationHistory: messages
      }, {
        timeout: 60000
      })

      const aiResponse = response.data.response
      const canApply = response.data.canApply || false

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        canApply
      }])
    } catch (error) {
      console.error('Failed to refine:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setSending(false)
    }
  }

  const handleApply = (content: string) => {
    setCurrentContent(content)
  }

  const handleSave = () => {
    onUpdateContent(currentContent)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px] flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Refine: {block.skillName}</SheetTitle>
          <SheetDescription>
            Work with AI to iterate and improve this content
          </SheetDescription>
        </SheetHeader>

        {/* Current Content */}
        <div className="px-6 py-4 border-b">
          <label className="text-sm font-medium mb-2 block">Current Content</label>
          <Textarea
            value={currentContent}
            onChange={(e) => setCurrentContent(e.target.value)}
            className="min-h-[150px] font-mono text-sm"
            placeholder="Edit your content here..."
          />
        </div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-3 border-b">
            <h3 className="text-sm font-medium">Conversation</h3>
            <p className="text-xs text-muted-foreground">
              Ask questions or request changes to refine the content
            </p>
          </div>

          <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <p className="mb-2">Start a conversation to refine this content</p>
                <p className="text-xs">Try: "Make this more concise" or "Add more examples"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === 'assistant' && msg.canApply && (
                        <Button
                          onClick={() => handleApply(msg.content)}
                          size="sm"
                          variant="outline"
                          className="mt-2 gap-2"
                        >
                          <Check className="w-3 h-3" />
                          Apply to Content
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="px-6 py-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Ask for changes or improvements..."
                className="resize-none"
                rows={2}
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                size="icon"
                className="h-auto"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
