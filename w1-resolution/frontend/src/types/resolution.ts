// Types for resolution visualization and management
export interface Resolution {
  id: string
  title: string
  measurable_criteria: string
  context?: string
  status: 'active' | 'completed'
  createdAt: string
  completedAt?: string
  updates: any[]
  progress?: number // 0-100
}

export interface ResolutionVisualizationData {
  name: string
  progress: number
  tier: 'immediate' | 'secondary' | 'maintenance'
  color: string
}

export interface StructuredInterfaceState {
  view: 'overview' | 'detail'
  selectedResolutionId?: string
  resolutions: Resolution[]
  isExpanded: boolean
}
