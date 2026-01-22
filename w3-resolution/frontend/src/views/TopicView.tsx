import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import Header from '../components/Header'
import DocumentView from './DocumentView'
import WorkingView from './WorkingView'
import ResourcesView from './ResourcesView'
import PresentationsView from './PresentationsView'
import AddToDocumentDialog from '../components/AddToDocumentDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '../hooks/useSession'
import { FileText, Library, Presentation, Sparkles } from 'lucide-react'
import { getDefaultSkills } from '../lib/defaultSkills'
import type { Resource, WorkingBlock, ResearchSkill } from '../types'

export default function TopicView() {
  const { topicId } = useParams<{ topicId: string }>()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedBlockForAdd, setSelectedBlockForAdd] = useState<WorkingBlock | null>(null)

  // If no topicId, this shouldn't happen due to routing
  if (!topicId) {
    return <Navigate to="/" replace />
  }

  const {
    session,
    loading,
    error,
    updateSession,
    addResource,
    removeResource,
    updateResource
  } = useSession(topicId, {
    id: topicId,
    topic: 'New Research Topic',
    queries: [],
    resources: [],
    presentations: [],
    skills: getDefaultSkills(),
    document: '',
    skillRunsSinceOrganize: 0,
    workingBlocks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const handleAddResource = (resource: Omit<Resource, 'id' | 'addedAt'>) => {
    const newResource: Resource = {
      ...resource,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    }
    addResource(newResource)
  }

  const handleRemoveResource = (resourceId: string) => {
    removeResource(resourceId)
  }

  const handleUpdateResource = (resourceId: string, updates: Partial<Resource>) => {
    updateResource(resourceId, updates)
  }

  // Working block handlers
  const handleAddToDocument = (blockId: string) => {
    const block = session.workingBlocks?.find(b => b.id === blockId)
    if (!block) return

    setSelectedBlockForAdd(block)
    setAddDialogOpen(true)
  }

  const handleAppendToDocument = () => {
    if (!selectedBlockForAdd) return

    // Add block content to document
    const currentDoc = session.document || ''
    const updatedDocument = currentDoc
      ? `${currentDoc}\n\n---\n\n${selectedBlockForAdd.content}`
      : selectedBlockForAdd.content

    // Remove block from working blocks
    const updatedBlocks = session.workingBlocks?.filter(b => b.id !== selectedBlockForAdd.id) || []

    updateSession({
      document: updatedDocument,
      workingBlocks: updatedBlocks
    })

    setSelectedBlockForAdd(null)
  }

  const handleMergeToDocument = async () => {
    if (!selectedBlockForAdd) return

    // Add block content to document first
    const currentDoc = session.document || ''
    const combinedContent = currentDoc
      ? `${currentDoc}\n\n---\n\n${selectedBlockForAdd.content}`
      : selectedBlockForAdd.content

    // Remove block from working blocks
    const updatedBlocks = session.workingBlocks?.filter(b => b.id !== selectedBlockForAdd.id) || []

    // Update with combined content
    updateSession({
      document: combinedContent,
      workingBlocks: updatedBlocks
    })

    setSelectedBlockForAdd(null)

    // TODO: Trigger organize skill automatically
    // This would need to be handled in DocumentView or we need to expose it here
    console.log('Merge & Organize: Combined content added, organize skill should run')
  }

  const handleUpdateBlock = (blockId: string, content: string) => {
    const updatedBlocks = session.workingBlocks?.map(b =>
      b.id === blockId
        ? { ...b, content, updatedAt: new Date().toISOString() }
        : b
    ) || []

    updateSession({ workingBlocks: updatedBlocks })
  }

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = session.workingBlocks?.filter(b => b.id !== blockId) || []
    updateSession({ workingBlocks: updatedBlocks })
  }

  const handleRerunSkill = (block: WorkingBlock) => {
    // This will be handled by DocumentView - we'll pass the block info back
    // For now, just log it
    console.log('Re-run skill:', block)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading research session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <Header />
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          ⚠️ {error} - Your data is safe but may not sync until reconnected.
        </div>
      )}

      {/* Topic Header */}
      <div className="border-b bg-background">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold mb-2">{session.topic}</h1>
          {session.description && (
            <p className="text-muted-foreground mb-3">{session.description}</p>
          )}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{session.queries.length} queries</span>
            <span>•</span>
            <span>{session.resources.length} resources</span>
            <span>•</span>
            <span>{session.presentations.length} presentations</span>
            <span>•</span>
            <span>{session.workingBlocks?.length || 0} working</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="document" className="h-full">
          <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-8">
              <TabsList className="grid w-full max-w-3xl grid-cols-4">
                <TabsTrigger value="working" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Working ({session.workingBlocks?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="document" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Document
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-2">
                  <Library className="w-4 h-4" />
                  Resources ({session.resources.length})
                </TabsTrigger>
                <TabsTrigger value="presentations" className="gap-2">
                  <Presentation className="w-4 h-4" />
                  Presentations ({session.presentations.length})
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="working" className="mt-0 h-full">
            <WorkingView
              workingBlocks={session.workingBlocks || []}
              skills={session.skills || []}
              sessionId={session.id}
              topic={session.topic}
              onAddToDocument={handleAddToDocument}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
              onRerunSkill={handleRerunSkill}
            />
          </TabsContent>

          <TabsContent value="document" className="mt-0 h-full">
            <DocumentView
              session={session}
              updateSession={updateSession}
            />
          </TabsContent>

          <TabsContent value="resources" className="mt-0 h-full">
            <ResourcesView
              resources={session.resources}
              onAddResource={handleAddResource}
              onRemoveResource={handleRemoveResource}
              onUpdateResource={handleUpdateResource}
            />
          </TabsContent>

          <TabsContent value="presentations" className="mt-0 h-full">
            <PresentationsView
              presentations={session.presentations}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add to Document Dialog */}
      <AddToDocumentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAppend={handleAppendToDocument}
        onMerge={handleMergeToDocument}
        blockTitle={selectedBlockForAdd?.title || ''}
      />
    </div>
  )
}
