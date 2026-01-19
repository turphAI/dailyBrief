import { useState, useRef } from 'react'
import { Send, Loader2, FileText, Lightbulb, Search, Link as LinkIcon, Plus, X, ExternalLink, Menu, ChevronRight } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { ResearchQuery, Resource, ResearchSession } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const RESEARCH_CATEGORIES = [
  { value: 'concept', label: 'Concept', icon: Lightbulb },
  { value: 'technology', label: 'Technology', icon: FileText },
  { value: 'company', label: 'Company/Product', icon: FileText },
  { value: 'implementation', label: 'Implementation', icon: FileText },
  { value: 'other', label: 'Other', icon: FileText }
] as const

const RESOURCE_TYPES = [
  { value: 'documentation', label: 'Documentation' },
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'github', label: 'GitHub' },
  { value: 'paper', label: 'Paper' },
  { value: 'other', label: 'Other' }
] as const

export default function ResearchView() {
  const [session, setSession] = useLocalStorage<ResearchSession>('deepResearch:session', {
    id: Date.now().toString(),
    topic: 'Generative UI (GenUI)',
    queries: [],
    resources: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<'concept' | 'technology' | 'company' | 'implementation' | 'other'>('concept')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null)

  // Resource form state
  const [showResourceForm, setShowResourceForm] = useState<string | null>(null)
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceType, setResourceType] = useState<'documentation' | 'article' | 'video' | 'github' | 'paper' | 'other'>('article')

  // Refs for scrolling
  const queryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const updateSession = (updates: Partial<ResearchSession>) => {
    setSession({
      ...session,
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }

  const handleResearch = async () => {
    if (!question.trim()) return

    setLoading(true)

    const newQuery: ResearchQuery = {
      id: Date.now().toString(),
      question: question.trim(),
      timestamp: new Date().toISOString(),
      category,
      resources: []
    }

    try {
      const response = await axios.post('/api/research', {
        topic: session.topic,
        question: question.trim(),
        category,
        context: session.queries.slice(0, 5).map(q => ({
          question: q.question,
          response: q.response
        }))
      })

      const completedQuery: ResearchQuery = {
        ...newQuery,
        response: response.data.response,
        sources: response.data.sources
      }

      updateSession({
        queries: [completedQuery, ...session.queries]
      })

      setQuestion('')
    } catch (error) {
      console.error('Research failed:', error)
      alert('Failed to get research response. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleResearch()
    }
  }

  const handleAddResource = (queryId: string) => {
    if (!resourceUrl.trim()) return

    const newResource: Resource = {
      id: Date.now().toString(),
      url: resourceUrl.trim(),
      title: resourceTitle.trim() || undefined,
      type: resourceType,
      addedAt: new Date().toISOString()
    }

    // Add to query
    updateSession({
      queries: session.queries.map(q =>
        q.id === queryId
          ? { ...q, resources: [...(q.resources || []), newResource] }
          : q
      )
    })

    // Reset form
    setResourceUrl('')
    setResourceTitle('')
    setResourceType('article')
    setShowResourceForm(null)
  }

  const handleRemoveResource = (queryId: string, resourceId: string) => {
    updateSession({
      queries: session.queries.map(q =>
        q.id === queryId
          ? { ...q, resources: q.resources?.filter(r => r.id !== resourceId) }
          : q
      )
    })
  }

  const handleTopicChange = (newTopic: string) => {
    updateSession({ topic: newTopic })
  }

  const scrollToQuery = (queryId: string) => {
    setSelectedQueryId(queryId)
    const element = queryRefs.current[queryId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // Highlight effect
      element.classList.add('ring-2', 'ring-blue-500')
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-blue-500')
      }, 2000)
    }
  }

  // Get all resources across all queries
  const allResources = session.queries.flatMap(q =>
    (q.resources || []).map(r => ({ ...r, queryId: q.id, queryQuestion: q.question }))
  )

  return (
    <div className="flex h-full">
      {/* Sidebar + Toggle */}
      <div className="relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Navigation</h3>
          <p className="text-xs text-gray-500 mt-1">
            {session.queries.length} questions • {allResources.length} resources
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Questions Section */}
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Questions ({session.queries.length})
            </h4>
            {session.queries.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No questions yet</p>
            ) : (
              <div className="space-y-2">
                {session.queries.map((query) => (
                  <Button
                    key={query.id}
                    variant={selectedQueryId === query.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-2"
                    onClick={() => scrollToQuery(query.id)}
                  >
                    <div className="text-left w-full">
                      <p className="text-xs font-medium line-clamp-2">
                        {query.question}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {new Date(query.timestamp).toLocaleDateString()}
                        </span>
                        {query.resources && query.resources.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {query.resources.length} resource{query.resources.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              All Resources ({allResources.length})
            </h4>
            {allResources.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No resources yet</p>
            ) : (
              <div className="space-y-2">
                {allResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                    >
                      <span className="line-clamp-1">{resource.title || resource.url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded">
                        {RESOURCE_TYPES.find(t => t.value === resource.type)?.label}
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => scrollToQuery(resource.queryId)}
                      >
                        View question →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Toggle Sidebar Button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 left-4 z-10 shadow-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronRight className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8 pl-16">
      {/* Topic Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-bold text-gray-900">Research Topic</h2>
          <div className="text-sm text-gray-500">
            {session.queries.length} queries saved
          </div>
        </div>
        <Input
          type="text"
          value={session.topic}
          onChange={(e) => handleTopicChange(e.target.value)}
          className="text-xl font-semibold border-2 border-primary"
          placeholder="Enter your research topic..."
        />
        <p className="text-sm text-gray-500 mt-2">
          All research is saved automatically. Last updated: {new Date(session.updatedAt).toLocaleString()}
        </p>
      </div>

      {/* Query Input */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Research Question
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What would you like to research about this topic?"
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter to submit, Shift+Enter for new line
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <div className="flex gap-2 flex-wrap">
              {RESEARCH_CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <Button
                    key={cat.value}
                    variant={category === cat.value ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setCategory(cat.value)}
                    disabled={loading}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {cat.label}
                  </Button>
                )
              })}
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleResearch}
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Ask Claude
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {session.queries.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">Research Findings</h3>
          {session.queries.map((query) => (
            <Card
              key={query.id}
              ref={(el) => (queryRefs.current[query.id] = el)}
              className="transition-all duration-300"
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {RESEARCH_CATEGORIES.find(c => c.value === query.category)?.label}
                    </Badge>
                  <h4 className="text-lg font-semibold text-gray-900 mt-2">
                    {query.question}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {new Date(query.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {query.response && (
                <div className="prose prose-sm max-w-none mt-4 mb-4">
                  <ReactMarkdown>{query.response}</ReactMarkdown>
                </div>
              )}

              {/* Resources Section */}
              <Separator className="my-4" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Resources ({query.resources?.length || 0})
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResourceForm(showResourceForm === query.id ? null : query.id)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Resource
                  </Button>
                </div>

                {/* Resource Form */}
                {showResourceForm === query.id && (
                  <Card className="mb-3 bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <Input
                          type="url"
                          value={resourceUrl}
                          onChange={(e) => setResourceUrl(e.target.value)}
                          placeholder="https://example.com/article"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="text"
                            value={resourceTitle}
                            onChange={(e) => setResourceTitle(e.target.value)}
                            placeholder="Title (optional)"
                          />
                          <Select value={resourceType} onValueChange={(value: any) => setResourceType(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCE_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddResource(query.id)}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setShowResourceForm(null)
                              setResourceUrl('')
                              setResourceTitle('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Resource List */}
                {query.resources && query.resources.length > 0 && (
                  <div className="space-y-2">
                    {query.resources.map((resource) => (
                      <Card key={resource.id} className="bg-muted/30">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <LinkIcon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1 break-all"
                              >
                                {resource.title || resource.url}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {RESOURCE_TYPES.find(t => t.value === resource.type)?.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(resource.addedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveResource(query.id, resource.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {session.queries.length === 0 && !loading && (
        <Card className="border-2 border-dashed">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start your research by asking a question about <span className="font-semibold">{session.topic}</span>
            </p>
          </CardContent>
        </Card>
      )}
        </div>
      </div>
    </div>
  )
}
