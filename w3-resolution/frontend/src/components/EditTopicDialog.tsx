import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Card } from './ui/card'

interface EditTopicDialogProps {
  open: boolean
  topicId: string
  currentTitle: string
  currentDescription?: string
  onOpenChange: (open: boolean) => void
  onUpdateTopic: (topicId: string, updates: { topic: string; description?: string }) => Promise<void>
}

export default function EditTopicDialog({
  open,
  topicId,
  currentTitle,
  currentDescription,
  onOpenChange,
  onUpdateTopic
}: EditTopicDialogProps) {
  const [title, setTitle] = useState(currentTitle)
  const [description, setDescription] = useState(currentDescription || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update form when props change
  useEffect(() => {
    setTitle(currentTitle)
    setDescription(currentDescription || '')
    setError(null)
  }, [currentTitle, currentDescription, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    // Check if anything changed
    if (title.trim() === currentTitle && description.trim() === (currentDescription || '')) {
      onOpenChange(false)
      return
    }

    setLoading(true)

    try {
      await onUpdateTopic(topicId, {
        topic: title.trim(),
        description: description.trim() || undefined
      })

      // Close dialog on success
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update topic')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog */}
      <Card className="relative w-full max-w-md p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Edit Topic</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update the title and description for this research topic
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm font-medium block mb-2">
              Topic Title *
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., LLM Agents, RAG Systems"
              autoFocus
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="description" className="text-sm font-medium block mb-2">
              Description (optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what you're researching"
              rows={3}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
