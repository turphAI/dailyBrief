import { useState } from 'react'
import { Plus, X, ExternalLink, File, Link as LinkIcon, Tag, FileText, Github, Video, BookOpen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import type { Resource } from '../types'

const RESOURCE_TYPES = [
  { value: 'documentation', label: 'Documentation', icon: BookOpen },
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'github', label: 'GitHub', icon: Github },
  { value: 'paper', label: 'Paper', icon: FileText },
  { value: 'file', label: 'File', icon: File },
  { value: 'other', label: 'Other', icon: FileText }
] as const

interface ResourcesViewProps {
  resources: Resource[]
  onAddResource: (resource: Omit<Resource, 'id' | 'addedAt'>) => void
  onRemoveResource: (resourceId: string) => void
  onUpdateResource: (resourceId: string, updates: Partial<Resource>) => void
}

export default function ResourcesView({
  resources,
  onAddResource,
  onRemoveResource,
  onUpdateResource
}: ResourcesViewProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceType, setResourceType] = useState<Resource['type']>('article')
  const [resourceNotes, setResourceNotes] = useState('')
  const [resourceTags, setResourceTags] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Limit file size to 5MB for localStorage
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }
      setSelectedFile(file)
      if (!resourceTitle) {
        setResourceTitle(file.name)
      }
    }
  }

  const handleAddResource = async () => {
    if (!resourceUrl && !selectedFile) {
      alert('Please provide a URL or select a file')
      return
    }

    let fileData: Resource['file'] | undefined

    if (selectedFile) {
      // Read file as base64 for small files
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string

        fileData = {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          data: base64
        }

        finishAddingResource(fileData)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      finishAddingResource()
    }
  }

  const finishAddingResource = (fileData?: Resource['file']) => {
    const tags = resourceTags.split(',').map(t => t.trim()).filter(Boolean)

    onAddResource({
      url: resourceUrl || undefined,
      file: fileData,
      title: resourceTitle || undefined,
      type: resourceType,
      notes: resourceNotes || undefined,
      tags: tags.length > 0 ? tags : undefined
    })

    // Reset form
    setResourceUrl('')
    setResourceTitle('')
    setResourceType('article')
    setResourceNotes('')
    setResourceTags('')
    setSelectedFile(null)
    setShowAddForm(false)
  }

  const getResourceIcon = (type?: Resource['type']) => {
    const resourceType = RESOURCE_TYPES.find(t => t.value === type)
    const Icon = resourceType?.icon || FileText
    return <Icon className="w-5 h-5" />
  }

  const groupedResources = resources.reduce((acc, resource) => {
    const type = resource.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">Resources Library</h2>
            <p className="text-muted-foreground mt-2">
              Manage all your research resources in one place
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{resources.length} total resources</span>
          <Separator orientation="vertical" className="h-4" />
          <span>{Object.keys(groupedResources).length} categories</span>
        </div>
      </div>

      {/* Add Resource Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Add New Resource</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  type="url"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  placeholder="https://example.com/resource"
                  disabled={!!selectedFile}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Or Upload File</label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  disabled={!!resourceUrl}
                  accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Resource title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (comma separated)</label>
              <Input
                type="text"
                value={resourceTags}
                onChange={(e) => setResourceTags(e.target.value)}
                placeholder="genui, react, examples"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                value={resourceNotes}
                onChange={(e) => setResourceNotes(e.target.value)}
                placeholder="Add notes about this resource..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddResource}>
                Add Resource
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddForm(false)
                  setResourceUrl('')
                  setResourceTitle('')
                  setResourceNotes('')
                  setResourceTags('')
                  setSelectedFile(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resources Grid - Grouped by Type */}
      {resources.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="text-center py-16">
            <LinkIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No resources yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your resource library by adding URLs, files, and references
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Resource
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedResources).map(([type, typeResources]) => (
            <div key={type}>
              <div className="flex items-center gap-2 mb-4">
                {getResourceIcon(type as Resource['type'])}
                <h3 className="text-xl font-semibold capitalize">
                  {RESOURCE_TYPES.find(t => t.value === type)?.label || type}
                </h3>
                <Badge variant="secondary">{typeResources.length}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeResources.map((resource) => (
                  <Card key={resource.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          {resource.url ? (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-primary hover:underline flex items-center gap-2 break-all"
                            >
                              {resource.title || resource.url}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : resource.file ? (
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{resource.title || resource.file.name}</span>
                            </div>
                          ) : (
                            <span className="text-sm font-medium">{resource.title}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveResource(resource.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {resource.notes && (
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {resource.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {resource.tags?.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(resource.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
