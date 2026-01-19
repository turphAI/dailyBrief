export interface Resource {
  id: string
  url?: string
  file?: {
    name: string
    size: number
    type: string
    data?: string // base64 encoded file data for small files
  }
  title?: string
  type?: 'documentation' | 'article' | 'video' | 'github' | 'paper' | 'file' | 'other'
  notes?: string
  tags?: string[]
  addedAt: string
  linkedToQuery?: string // Optional link to a specific query
}

export interface ResearchQuery {
  id: string
  question: string
  timestamp: string
  response?: string
  sources?: string[]
  resources?: Resource[]
  notes?: string
  category?: 'concept' | 'technology' | 'company' | 'implementation' | 'other'
}

export interface ResearchSession {
  id: string
  topic: string
  description?: string
  queries: ResearchQuery[]
  resources: Resource[]
  createdAt: string
  updatedAt: string
}
