import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import RefineBlockDialog from '../components/RefineBlockDialog'
import { RefreshCw, ArrowRight, Trash2, FileText, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import type { WorkingBlock, ResearchSkill } from '../types'

interface WorkingViewProps {
  workingBlocks: WorkingBlock[]
  skills: ResearchSkill[]
  sessionId: string
  topic: string
  onAddToDocument: (blockId: string) => void
  onUpdateBlock: (blockId: string, content: string) => void
  onDeleteBlock: (blockId: string) => void
  onRerunSkill: (block: WorkingBlock) => void
}

export default function WorkingView({
  workingBlocks,
  skills,
  sessionId,
  topic,
  onAddToDocument,
  onUpdateBlock,
  onDeleteBlock,
  onRerunSkill
}: WorkingViewProps) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [expandedBlockIds, setExpandedBlockIds] = useState<Set<string>>(new Set())
  const [refiningBlock, setRefiningBlock] = useState<WorkingBlock | null>(null)
  const [refineDialogOpen, setRefineDialogOpen] = useState(false)

  const toggleExpanded = (blockId: string) => {
    setExpandedBlockIds(prev => {
      const next = new Set(prev)
      if (next.has(blockId)) {
        next.delete(blockId)
      } else {
        next.add(blockId)
      }
      return next
    })
  }

  const handleRefineBlock = (block: WorkingBlock) => {
    setRefiningBlock(block)
    setRefineDialogOpen(true)
  }

  const handleUpdateFromRefine = (content: string) => {
    if (refiningBlock) {
      onUpdateBlock(refiningBlock.id, content)
    }
  }

  const handleEditBlock = (blockId: string) => {
    setEditingBlockId(blockId)
    // Ensure card is expanded when editing
    setExpandedBlockIds(prev => {
      const next = new Set(prev)
      next.add(blockId)
      return next
    })
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const then = new Date(timestamp)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  if (workingBlocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Working Content</h3>
          <p className="text-sm text-muted-foreground">
            Run a skill and send the output to "Working" to refine it here before adding to your document.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background">
      <div className="border-b p-4">
        <h2 className="text-xl font-semibold">Working Space</h2>
        <p className="text-sm text-muted-foreground">
          Refine skill outputs before adding them to your document
        </p>
      </div>

      <ScrollArea className="h-[calc(100%-5rem)]">
        <div className="max-w-4xl mx-auto p-8 space-y-4">
          {workingBlocks.map((block) => {
            const isExpanded = expandedBlockIds.has(block.id)
            const isEditing = editingBlockId === block.id

            return (
              <Card key={block.id} className="p-4">
                {/* Header - Always Visible */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(block.id)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <div
                    className="flex-1 min-w-0 cursor-pointer hover:bg-muted/30 p-2 rounded-md transition-colors"
                    onClick={() => !isEditing && toggleExpanded(block.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate flex-1">{block.title}</h3>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {block.skillName}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(block.updatedAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleEditBlock(block.id)}
                      size="sm"
                      variant="outline"
                      className="h-8"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleRefineBlock(block)}
                      size="sm"
                      variant="outline"
                      className="gap-2 h-8"
                    >
                      <Sparkles className="w-4 h-4" />
                      Refine
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <>
                    <div className="mt-4 mb-4">
                      {isEditing ? (
                        <Textarea
                          value={block.content}
                          onChange={(e) => onUpdateBlock(block.id, e.target.value)}
                          className="min-h-[200px] font-mono text-sm"
                        />
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-md">
                          {block.content.split('\n').map((line, i) => (
                            <p key={i}>{line || '\u00A0'}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      {isEditing && (
                        <Button
                          onClick={() => setEditingBlockId(null)}
                          size="sm"
                          variant="outline"
                        >
                          Done Editing
                        </Button>
                      )}
                      <Button
                        onClick={() => onAddToDocument(block.id)}
                        size="sm"
                        className="gap-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Add to Document
                      </Button>
                      <Button
                        onClick={() => onRerunSkill(block)}
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Re-run
                      </Button>
                      <Button
                        onClick={() => onDeleteBlock(block.id)}
                        size="sm"
                        variant="ghost"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      {/* Refine Block Dialog */}
      <RefineBlockDialog
        block={refiningBlock}
        open={refineDialogOpen}
        onOpenChange={setRefineDialogOpen}
        onUpdateContent={handleUpdateFromRefine}
        sessionId={sessionId}
        topic={topic}
      />
    </div>
  )
}
