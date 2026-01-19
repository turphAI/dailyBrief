import { useState } from 'react'
import Header from './components/Header'
import ResearchView from './views/ResearchView'
import ResourcesView from './views/ResourcesView'
import PresentationsView from './views/PresentationsView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from './hooks/useSession'
import { Search, Library, Presentation } from 'lucide-react'
import type { Resource } from './types'

function App() {
  const {
    session,
    loading,
    error,
    updateSession,
    addResource,
    removeResource,
    updateResource
  } = useSession('default', {
    id: 'default',
    topic: 'Generative UI (GenUI)',
    queries: [],
    resources: [],
    presentations: [],
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
    <div className="h-screen flex flex-col bg-background">
      <Header />
      {error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-sm text-yellow-800">
          ⚠️ {error} - Your data is safe but may not sync until reconnected.
        </div>
      )}
      <main className="flex-1 overflow-auto">
        <Tabs defaultValue="research" className="h-full">
          <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-8">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="research" className="gap-2">
                  <Search className="w-4 h-4" />
                  Research
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

          <TabsContent value="research" className="mt-0 h-full">
            <ResearchView
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
      </main>
    </div>
  )
}

export default App
