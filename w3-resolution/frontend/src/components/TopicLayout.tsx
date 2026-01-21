import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useTopics } from '../hooks/useTopics'
import TopicList from './TopicList'
import CreateTopicDialog from './CreateTopicDialog'
import EditTopicDialog from './EditTopicDialog'
import DeleteTopicConfirmDialog from './DeleteTopicConfirmDialog'

export default function TopicLayout() {
  const navigate = useNavigate()
  const { topics, loading, error, createTopic, deleteTopic, updateTopicMetadata } = useTopics()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    topicId: string
    topicTitle: string
    topicDescription?: string
  }>({
    open: false,
    topicId: '',
    topicTitle: '',
    topicDescription: undefined
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; topicId: string; topicTitle: string }>({
    open: false,
    topicId: '',
    topicTitle: ''
  })

  const handleCreateTopic = async (topicData: Parameters<typeof createTopic>[0]) => {
    const newTopicId = await createTopic(topicData)
    // Navigate to the newly created topic
    navigate(`/topic/${newTopicId}`)
    return newTopicId
  }

  const handleEditTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId)
    if (topic) {
      setEditDialog({
        open: true,
        topicId,
        topicTitle: topic.topic,
        topicDescription: topic.description
      })
    }
  }

  const handleDeleteTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId)
    if (topic) {
      setDeleteDialog({
        open: true,
        topicId,
        topicTitle: topic.topic
      })
    }
  }

  const confirmDeleteTopic = async () => {
    if (deleteDialog.topicId) {
      await deleteTopic(deleteDialog.topicId)

      // If we're currently viewing the deleted topic, navigate to another topic
      if (window.location.pathname.includes(deleteDialog.topicId)) {
        const remainingTopics = topics.filter(t => t.id !== deleteDialog.topicId)
        if (remainingTopics.length > 0) {
          navigate(`/topic/${remainingTopics[0].id}`)
        } else {
          navigate('/')
        }
      }
    }
  }

  // Show loading state
  if (loading && topics.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading topics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <TopicList
        topics={topics}
        onCreateTopic={() => setCreateDialogOpen(true)}
        onEditTopic={handleEditTopic}
        onDeleteTopic={handleDeleteTopic}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-background">
        {error && (
          <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
            ⚠️ {error}
          </div>
        )}
        <Outlet />
      </main>

      {/* Dialogs */}
      <CreateTopicDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateTopic={handleCreateTopic}
      />

      <EditTopicDialog
        open={editDialog.open}
        topicId={editDialog.topicId}
        currentTitle={editDialog.topicTitle}
        currentDescription={editDialog.topicDescription}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        onUpdateTopic={updateTopicMetadata}
      />

      <DeleteTopicConfirmDialog
        open={deleteDialog.open}
        topicTitle={deleteDialog.topicTitle}
        topicCount={topics.length}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={confirmDeleteTopic}
      />
    </div>
  )
}
