import { Resolution, ResolutionVisualizationData } from '../types/resolution'

/**
 * Calculate progress for a resolution based on logged updates with progressDelta
 * Falls back to a time-based heuristic if no explicit progress is tracked
 */
export function calculateProgress(resolution: Resolution): number {
  // If completed, return 100%
  if (resolution.status === 'completed') {
    return 100
  }

  // Check if we have explicit progress updates with progressDelta
  const updates = resolution.updates || []
  const progressUpdates = updates.filter(u => u.progressDelta !== undefined && u.progressDelta !== null)
  
  if (progressUpdates.length > 0) {
    // Sum up all progressDelta values from updates
    const totalProgress = progressUpdates.reduce((sum, update) => {
      return sum + (update.progressDelta || 0)
    }, 0)
    
    // Clamp between 0 and 100
    return Math.max(0, Math.min(100, totalProgress))
  }

  // For cadence-based resolutions, calculate from activity completions
  if (resolution.cadence && resolution.activityCompletions) {
    const completions = resolution.activityCompletions.length
    // Estimate based on typical yearly goal (52 weeks)
    const estimatedTotal = resolution.cadence.period === 'day' ? 365 :
                           resolution.cadence.period === 'week' ? 52 : 12
    const targetCompletions = estimatedTotal * resolution.cadence.frequency
    return Math.min(100, Math.round((completions / targetCompletions) * 100))
  }

  // Fallback: time-based heuristic for resolutions without explicit tracking
  const createdAt = new Date(resolution.createdAt)
  const now = new Date()
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceCreation < 1) {
    return 0
  }

  // Estimate based on measurable criteria
  const criteria = resolution.measurable_criteria.toLowerCase()

  if (criteria.includes('daily')) {
    return Math.min(daysSinceCreation * 1.5, 50)
  } else if (criteria.includes('weekly') || criteria.includes('per week')) {
    return Math.min((daysSinceCreation / 7) * 20, 50)
  } else if (criteria.includes('month')) {
    return Math.min((daysSinceCreation / 30) * 15, 40)
  } else {
    return Math.min((daysSinceCreation / 365) * 30, 50)
  }
}

/**
 * Categorize resolution by tier (based on assumed prioritization)
 * In future, this will come from the backend prioritizeResolutions tool
 */
export function categorizeTier(
  resolution: Resolution,
  allResolutions: Resolution[],
  index: number
): 'immediate' | 'secondary' | 'maintenance' {
  const total = allResolutions.length
  
  // Simple heuristic: first 1-2 are immediate, next 2-3 secondary, rest maintenance
  if (total <= 2) {
    return 'immediate'
  } else if (total <= 4) {
    return index < 2 ? 'immediate' : 'secondary'
  } else {
    if (index < 2) return 'immediate'
    if (index < 4) return 'secondary'
    return 'maintenance'
  }
}

/**
 * Get color based on tier
 */
export function getTierColor(tier: 'immediate' | 'secondary' | 'maintenance'): string {
  switch (tier) {
    case 'immediate':
      return 'hsl(22, 95%, 50%)' // Vibrant orange
    case 'secondary':
      return 'hsl(217, 91%, 60%)' // Blue
    case 'maintenance':
      return 'hsl(160, 84%, 40%)' // Green
    default:
      return 'hsl(0, 0%, 50%)' // Gray
  }
}

/**
 * Convert resolutions to radar chart data
 */
export function resolutionToRadarData(
  resolutions: Resolution[]
): ResolutionVisualizationData[] {
  return resolutions
    .filter((r) => r.status === 'active')
    .map((resolution, index) => {
      const tier = categorizeTier(resolution, resolutions, index)
      const progress = calculateProgress(resolution)

      return {
        name: resolution.title.split(' ').slice(0, 2).join(' '), // Shorten for chart
        progress,
        tier,
        color: getTierColor(tier)
      }
    })
}

/**
 * Get tier label and description
 */
export function getTierInfo(tier: 'immediate' | 'secondary' | 'maintenance'): {
  label: string
  description: string
  icon: string
} {
  switch (tier) {
    case 'immediate':
      return {
        label: 'Immediate Focus',
        description: 'Your priority targets - allocate peak energy here',
        icon: '🎯'
      }
    case 'secondary':
      return {
        label: 'Secondary',
        description: 'Important but steady progress - maintain momentum',
        icon: '📈'
      }
    case 'maintenance':
      return {
        label: 'Maintenance',
        description: 'Keep momentum - light touch prevents regression',
        icon: '⚡'
      }
    default:
      return {
        label: 'Unknown',
        description: '',
        icon: '❓'
      }
  }
}

/**
 * Calculate overall health across all resolutions
 */
export function calculateOverallHealth(resolutions: Resolution[]): {
  averageProgress: number
  activeCount: number
  completedCount: number
  immediateCount: number
  secondaryCount: number
  maintenanceCount: number
} {
  const active = resolutions.filter((r) => r.status === 'active')
  const completed = resolutions.filter((r) => r.status === 'completed')
  
  const averageProgress = active.length > 0
    ? Math.round(active.reduce((sum, r) => sum + calculateProgress(r), 0) / active.length)
    : 0

  let immediateCount = 0
  let secondaryCount = 0
  let maintenanceCount = 0

  active.forEach((r, index) => {
    const tier = categorizeTier(r, resolutions, index)
    if (tier === 'immediate') immediateCount++
    else if (tier === 'secondary') secondaryCount++
    else maintenanceCount++
  })

  return {
    averageProgress,
    activeCount: active.length,
    completedCount: completed.length,
    immediateCount,
    secondaryCount,
    maintenanceCount
  }
}
