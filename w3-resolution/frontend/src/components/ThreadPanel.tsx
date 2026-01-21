import { useState } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { CheckCircle2, Circle, Archive, Sparkles, Loader2 } from 'lucide-react'
import type { ConversationThread, Message } from '../types'

interface ThreadPanelProps {
  threads: ConversationThread[]
  messages: Message[]
  onCreateThread: (title: string, messageIds: string[]) => void
  onAnalyzeThread: (threadId: string) => void
  onApplyThread: (threadId: string) => void
  analyzingThreadId?: string
}

export default function ThreadPanel({
  threads,
  messages,
  onCreateThread,
  onAnalyzeThread,
  onApplyThread,
  analyzingThreadId
}: ThreadPanelProps) {
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)

  const handleCreateThread = () => {
    if (newThreadTitle.trim() && selectedMessageIds.size > 0) {
      onCreateThread(newThreadTitle.trim(), Array.from(selectedMessageIds))
      setNewThreadTitle('')
      setSelectedMessageIds(new Set())
      setShowCreateForm(false)
    }
  }

  const toggleMessageSelection = (messageId: string) => {
    const newSelection = new Set(selectedMessageIds)
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId)
    } else {
      newSelection.add(messageId)
    }
    setSelectedMessageIds(newSelection)
  }

  const getThreadMessages = (thread: ConversationThread) => {
    return thread.messageIds
      .map(id => messages.find(m => m.id === id))
      .filter(Boolean) as Message[]
  }

  const StatusIcon = ({ status }: { status: ConversationThread['status'] }) => {
    switch (status) {
      case 'applied':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'archived':
        return <Archive className="w-4 h-4 text-muted-foreground" />
      default:
        return <Circle className="w-4 h-4 text-yellow-600" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/30 border-l">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <h3 className="font-semibold mb-2">Conversation Threads</h3>
        <p className="text-xs text-muted-foreground">
          Group related messages and apply them to your document
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Thread List */}
          {threads.map(thread => {
            const threadMessages = getThreadMessages(thread)
            return (
              <div
                key={thread.id}
                className="bg-background rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <StatusIcon status={thread.status} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{thread.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {threadMessages.length} messages
                      {thread.appliedAt && ` • Applied ${new Date(thread.appliedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                {thread.summary && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                    {thread.summary}
                  </p>
                )}

                {thread.status === 'draft' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => onAnalyzeThread(thread.id)}
                      disabled={analyzingThreadId === thread.id}
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-2 text-xs"
                    >
                      {analyzingThreadId === thread.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      Analyze
                    </Button>
                    {thread.summary && (
                      <Button
                        onClick={() => onApplyThread(thread.id)}
                        size="sm"
                        className="flex-1 text-xs"
                      >
                        Apply to Doc
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {threads.length === 0 && !showCreateForm && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No threads yet</p>
              <p className="text-xs mt-1 mb-3">Create threads to organize your research</p>
              {messages.length > 1 && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 text-left">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                    💡 You have {messages.length} messages
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Click "+ New Thread" below to organize them into a focused thread, then analyze and apply to your document.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Create Thread Section */}
      <div className="p-4 border-t bg-background">
        {!showCreateForm ? (
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="outline"
            className="w-full"
          >
            + New Thread
          </Button>
        ) : (
          <div className="space-y-2">
            <Input
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              placeholder="Thread title..."
              className="text-sm"
            />

            <div className="text-xs text-muted-foreground mb-2">
              Select messages ({selectedMessageIds.size} selected):
            </div>

            <ScrollArea className="max-h-32 border rounded p-2 mb-2">
              <div className="space-y-1">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => toggleMessageSelection(msg.id)}
                    className={`text-xs p-2 rounded cursor-pointer ${
                      selectedMessageIds.has(msg.id)
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="font-medium">{msg.role}:</span>{' '}
                    {msg.content.substring(0, 50)}...
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateThread}
                disabled={!newThreadTitle.trim() || selectedMessageIds.size === 0}
                size="sm"
                className="flex-1"
              >
                Create
              </Button>
              <Button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewThreadTitle('')
                  setSelectedMessageIds(new Set())
                }}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
