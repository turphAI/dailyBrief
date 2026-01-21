import { AlertTriangle, X } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface DeleteTopicConfirmDialogProps {
  open: boolean
  topicTitle: string
  topicCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export default function DeleteTopicConfirmDialog({
  open,
  topicTitle,
  topicCount,
  onOpenChange,
  onConfirm
}: DeleteTopicConfirmDialogProps) {
  const isLastTopic = topicCount <= 1

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
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
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Delete Topic</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Are you sure you want to delete "{topicTitle}"?
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Warning Message */}
        <div className="bg-muted p-4 rounded-lg mb-4">
          <p className="text-sm">
            This action cannot be undone. All queries, resources, and presentations associated with
            this topic will be permanently deleted.
          </p>
        </div>

        {/* Last Topic Warning */}
        {isLastTopic && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">
            ⚠️ This is your last topic. You won't be able to delete it.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLastTopic}
          >
            {isLastTopic ? 'Cannot Delete' : 'Delete Topic'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
