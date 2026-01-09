// Types for resolution visualization and management

export interface ResolutionCadence {
  frequency: number                    // How many times (e.g., 1, 3, 5)
  period: 'day' | 'week' | 'month'     // Per what period
  targetDays?: number[]                // Optional: specific days (0=Sun, 6=Sat)
  description?: string                 // Human-readable: "once a week"
}

export interface Milestone {
  id: string
  title: string                        // "Complete 10 hikes"
  target: number                       // Target count (e.g., 10)
  current: number                      // Current progress count
  unit?: string                        // Optional unit: "hikes", "books", "workouts"
  completedAt?: string                 // ISO timestamp when milestone was achieved
  createdAt: string
}

export interface ActivityCompletion {
  id: string
  timestamp: string                    // When the activity was completed
  description: string                  // What was done: "Hiked Mt. Washington"
  matchedFromMessage?: string          // Original user message that triggered this
  periodStart: string                  // Start of the cadence period this counts toward
  periodEnd: string                    // End of the cadence period
  createdAt: string                    // When this record was created
}

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
  
  // Activity tracking (optional - for resolutions with recurring activities)
  cadence?: ResolutionCadence
  milestones?: Milestone[]
  activityCompletions?: ActivityCompletion[]
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

// Helper to calculate cadence progress for current period
export function calculateCadenceProgress(resolution: Resolution): {
  completedCount: number
  targetCount: number
  isOnTrack: boolean
  remainingCount: number
  periodLabel: string
} | null {
  if (!resolution.cadence) return null
  
  const { frequency, period } = resolution.cadence
  const completions = resolution.activityCompletions || []
  
  // Get current period bounds
  const now = new Date()
  let periodStart: Date
  let periodEnd: Date
  let periodLabel: string
  
  switch (period) {
    case 'day':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 1)
      periodLabel = 'today'
      break
    case 'week':
      const dayOfWeek = now.getDay()
      periodStart = new Date(now)
      periodStart.setDate(now.getDate() - dayOfWeek)
      periodStart.setHours(0, 0, 0, 0)
      periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 7)
      periodLabel = 'this week'
      break
    case 'month':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      periodLabel = 'this month'
      break
    default:
      periodLabel = 'this period'
      periodStart = new Date()
      periodEnd = new Date()
  }
  
  // Count completions in current period
  const periodCompletions = completions.filter(c => {
    const timestamp = new Date(c.timestamp)
    return timestamp >= periodStart && timestamp < periodEnd
  })
  
  const completedCount = periodCompletions.length
  const targetCount = frequency
  const remainingCount = Math.max(0, targetCount - completedCount)
  const isOnTrack = completedCount >= targetCount
  
  return {
    completedCount,
    targetCount,
    isOnTrack,
    remainingCount,
    periodLabel
  }
}
