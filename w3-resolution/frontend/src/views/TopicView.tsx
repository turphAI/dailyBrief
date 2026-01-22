import { useParams, Navigate } from 'react-router-dom'
import Header from '../components/Header'
import DocumentView from './DocumentView'
import ResourcesView from './ResourcesView'
import PresentationsView from './PresentationsView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from '../hooks/useSession'
import { FileText, Library, Presentation } from 'lucide-react'
import { getDefaultSkills } from '../lib/defaultSkills'
import type { Resource } from '../types'

export default function TopicView() {
  const { topicId } = useParams<{ topicId: string }>()

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
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="document" className="h-full">
          <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-8">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
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
    </div>
  )
}
