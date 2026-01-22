import { Button } from './ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet'
import { FileText, Sparkles } from 'lucide-react'

interface AddToDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAppend: () => void
  onMerge: () => void
  blockTitle: string
}

export default function AddToDocumentDialog({
  open,
  onOpenChange,
  onAppend,
  onMerge,
  blockTitle
}: AddToDocumentDialogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Add to Document</SheetTitle>
          <SheetDescription>
            How would you like to add "{blockTitle}" to your document?
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-3 py-6">
          <button
            onClick={() => {
              onAppend()
              onOpenChange(false)
            }}
            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <FileText className="w-5 h-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium mb-1">Append to End</div>
              <div className="text-sm text-muted-foreground">
                Add this content to the end of your document with a separator. Quick and preserves everything as-is.
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              onMerge()
              onOpenChange(false)
            }}
            className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-medium mb-1">Merge & Organize</div>
              <div className="text-sm text-muted-foreground">
                Intelligently integrate this content into your document. The entire document will be reorganized for better flow and structure.
              </div>
            </div>
          </button>
        </div>

        <div className="pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
