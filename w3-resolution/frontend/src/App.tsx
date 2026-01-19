import { useState } from 'react'
import Header from './components/Header'
import ResearchView from './views/ResearchView'
import ResourcesView from './views/ResourcesView'
import PresentationsView from './views/PresentationsView'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLocalStorage } from './hooks/useLocalStorage'
import { Search, Library, Presentation } from 'lucide-react'
import type { ResearchSession, Resource } from './types'

function App() {
  const [session, setSession] = useLocalStorage<ResearchSession>('deepResearch:session', {
    id: Date.now().toString(),
    topic: 'Generative UI (GenUI)',
    queries: [],
    resources: [],
    presentations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const updateSession = (updates: Partial<ResearchSession>) => {
    setSession({
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  const handleAddResource = (resource: Omit<Resource, 'id' | 'addedAt'>) => {
    const newResource: Resource = {
      ...resource,
      id: Date.now().toString(),
      addedAt: new Date().toISOString()
    }

    updateSession({
      resources: [...session.resources, newResource]
    })
  }

  const handleRemoveResource = (resourceId: string) => {
    updateSession({
      resources: session.resources.filter(r => r.id !== resourceId)
    })
  }

  const handleUpdateResource = (resourceId: string, updates: Partial<Resource>) => {
    updateSession({
      resources: session.resources.map(r =>
        r.id === resourceId ? { ...r, ...updates } : r
      )
    })
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header />
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
