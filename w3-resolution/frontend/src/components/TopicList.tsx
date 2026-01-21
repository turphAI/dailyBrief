import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import type { ResearchSession } from '../types'

interface TopicListProps {
  topics: ResearchSession[]
  onCreateTopic: () => void
  onEditTopic: (topicId: string) => void
  onDeleteTopic: (topicId: string) => void
}

type SortOption = 'recent' | 'alphabetical' | 'mostActive'

export default function TopicList({ topics, onCreateTopic, onEditTopic, onDeleteTopic }: TopicListProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  // Get current topic ID from URL
  const currentTopicId = location.pathname.split('/topic/')[1]

  // Filter topics by search query
  const filteredTopics = topics.filter(topic =>
    topic.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort topics
  const sortedTopics = [...filteredTopics].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'alphabetical':
        return a.topic.localeCompare(b.topic)
      case 'mostActive':
        return b.queries.length - a.queries.length
      default:
        return 0
    }
  })

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (collapsed) {
    return (
      <div className="w-12 bg-muted/30 border-r flex flex-col items-center p-2 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="w-8 h-8"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="w-80 bg-muted/30 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Research Topics</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="w-8 h-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        <Button
          onClick={onCreateTopic}
          className="w-full"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Topic
        </Button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-1">
          <Button
            variant={sortBy === 'recent' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('recent')}
            className="flex-1 text-xs"
          >
            Recent
          </Button>
          <Button
            variant={sortBy === 'alphabetical' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('alphabetical')}
            className="flex-1 text-xs"
          >
            A-Z
          </Button>
          <Button
            variant={sortBy === 'mostActive' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setSortBy('mostActive')}
            className="flex-1 text-xs"
          >
            Active
          </Button>
        </div>
      </div>

      {/* Topic List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sortedTopics.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No topics found' : 'No topics yet'}
            </div>
          ) : (
            sortedTopics.map((topic) => {
              const isActive = topic.id === currentTopicId
              return (
                <div
                  key={topic.id}
                  className={`group relative rounded-lg p-3 transition-colors cursor-pointer hover:bg-muted ${
                    isActive ? 'bg-muted ring-2 ring-primary' : ''
                  }`}
                  onClick={() => navigate(`/topic/${topic.id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {topic.topic}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{topic.queries.length} queries</span>
                        <span>•</span>
                        <span>{getRelativeTime(topic.updatedAt)}</span>
                      </div>
                      {topic.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {topic.description}
                        </p>
                      )}
                    </div>

                    {/* Action buttons (show on hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditTopic(topic.id)
                        }}
                        className="w-7 h-7 flex-shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTopic(topic.id)
                        }}
                        className="w-7 h-7 flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t text-xs text-muted-foreground text-center">
        {topics.length} topic{topics.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
