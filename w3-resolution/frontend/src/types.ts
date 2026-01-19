export interface Resource {
  id: string
  url: string
  title?: string
  type?: 'documentation' | 'article' | 'video' | 'github' | 'paper' | 'other'
  notes?: string
  addedAt: string
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
