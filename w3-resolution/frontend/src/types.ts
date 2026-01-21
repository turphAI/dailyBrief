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

export interface Presentation {
  id: string
  title: string
  version: string
  targetAudience: string
  description?: string
  slides?: any[] // TODO: Define slide structure
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ConversationThread {
  id: string
  title: string
  messageIds: string[]
  createdAt: string
  status: 'draft' | 'applied' | 'archived'
  summary?: string
  appliedAt?: string
  documentImpact?: {
    section: string
    preview: string
  }
}

export interface SkillParameter {
  name: string
  type: 'text' | 'textarea' | 'section-select' | 'keyword' | 'url'
  required: boolean
  placeholder?: string
  description?: string
}

export interface ResearchSkill {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  userPromptTemplate: string
  parameters: SkillParameter[]
  targetStrategy: 'new-section' | 'append-to-section' | 'insert-at-cursor' | 'replace-selection'
  enabled: boolean
  createdAt: string
  isBuiltIn?: boolean
}

export interface ResearchSession {
  id: string
  topic: string
  description?: string
  queries: ResearchQuery[]
  resources: Resource[]
  presentations: Presentation[]
  threads?: ConversationThread[]
  messages?: Message[]
  skills?: ResearchSkill[]
  document?: string  // The actual markdown document content
  createdAt: string
  updatedAt: string
}
