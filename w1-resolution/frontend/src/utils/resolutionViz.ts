import { Resolution, ResolutionVisualizationData } from '../types/resolution'

/**
 * Calculate progress for a resolution based on its criteria and time since creation
 * This is a heuristic since we don't have explicit progress tracking yet
 */
export function calculateProgress(resolution: Resolution): number {
  // If completed, return 100%
  if (resolution.status === 'completed') {
    return 100
  }

  // If just created (less than 1 week), start with 0%
  const createdAt = new Date(resolution.createdAt)
  const now = new Date()
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceCreation < 1) {
    return 0
  }

  // Estimate based on measurable criteria
  const criteria = resolution.measurable_criteria.toLowerCase()

  if (criteria.includes('daily')) {
    // Daily resolutions: estimate 1-3% per day up to 50% over time
    return Math.min(daysSinceCreation * 1.5, 50)
  } else if (criteria.includes('weekly') || criteria.includes('per week')) {
    // Weekly resolutions: slower progression
    return Math.min((daysSinceCreation / 7) * 20, 50)
  } else if (criteria.includes('month')) {
    // Monthly goals: even slower
    return Math.min((daysSinceCreation / 30) * 15, 40)
  } else {
    // Default: general progression
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
