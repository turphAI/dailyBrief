import { ToolResult, Resolution } from './types'

interface PrioritizationInput {
  timePerWeek?: number // Hours available per week
  focusArea?: string // Current life focus area
  constraints?: string // Any constraints or challenges
  askFollowUp?: boolean // Whether to ask clarifying questions
}

interface PrioritizationStrategy {
  immediate: Array<{
    resolution: string
    reason: string
    suggestedWeeklyHours: number
  }>
  secondary: Array<{
    resolution: string
    reason: string
    suggestedWeeklyHours: number
  }>
  maintenance: Array<{
    resolution: string
    reason: string
    suggestedMinimalEffort: string
  }>
  dependencies: Array<{
    primary: string
    dependent: string
    reason: string
  }>
  strategy: string
  questionsForClarification?: string[]
}

/**
 * Intelligently prioritize resolutions based on context, dependencies, and goals
 * This tool uses reasoning to create a fluid prioritization strategy that allows
 * progress on all resolutions while focusing effort where it matters most
 * 
 * @param input - { timePerWeek?, focusArea?, constraints?, askFollowUp? }
 * @param resolutions - Map of all resolutions
 * @returns ToolResult with prioritization strategy
 */
export function prioritizeResolutions(
  input: PrioritizationInput,
  resolutions: Map<string, Resolution>
): ToolResult {
  try {
    const activeResolutions = Array.from(resolutions.values()).filter(
      (r) => r.status === 'active'
    )

    if (activeResolutions.length === 0) {
      return {
        success: false,
        message: 'No active resolutions to prioritize',
        error: 'Create some resolutions first before prioritizing'
      }
    }

    const timePerWeek = input.timePerWeek || 20 // Default to 20 hours/week
    const focusArea = input.focusArea || 'balanced growth'
    const constraints = input.constraints || 'none specified'

    // Analyze resolutions for key factors
    const analysis = analyzeResolutions(activeResolutions, focusArea, constraints)

    // Create prioritization strategy
    const strategy = createPrioritizationStrategy(
      activeResolutions,
      analysis,
      timePerWeek,
      focusArea
    )

    // Generate clarifying questions if requested
    const questions = input.askFollowUp ? generateClarifyingQuestions(
      activeResolutions,
      analysis
    ) : undefined

    const strategyWithQuestions: PrioritizationStrategy = {
      ...strategy,
      questionsForClarification: questions
    }

    console.log(`📊 Prioritized ${activeResolutions.length} active resolutions`)

    return {
      success: true,
      message: `Created prioritization strategy for ${activeResolutions.length} resolutions`,
      resolution: strategyWithQuestions as any
    }
  } catch (error) {
    console.error('Error in prioritizeResolutions:', error)
    return {
      success: false,
      message: 'Failed to prioritize resolutions',
      error: (error as Error).message
    }
  }
}

/**
 * Analyze resolutions for key characteristics that inform prioritization
 */
function analyzeResolutions(
  resolutions: any[],
  focusArea: string,
  constraints: string
): any {
  const analysis = {
    total: resolutions.length,
    byType: {} as Record<string, string[]>,
    estimatedEffort: {} as Record<string, 'high' | 'medium' | 'low'>,
    interdependencies: [] as Array<[string, string]>
  }

  // Categorize by resolution type
  resolutions.forEach((r) => {
    const title = r.title.toLowerCase()
    let category = 'other'

    if (title.includes('exercise') || title.includes('fitness') || title.includes('health')) {
      category = 'health'
    } else if (title.includes('learn') || title.includes('study') || title.includes('skill')) {
      category = 'learning'
    } else if (title.includes('read') || title.includes('book')) {
      category = 'reading'
    } else if (title.includes('work') || title.includes('career') || title.includes('business')) {
      category = 'career'
    } else if (title.includes('relation') || title.includes('family') || title.includes('social')) {
      category = 'relationships'
    } else if (title.includes('meditat') || title.includes('mindful') || title.includes('mental')) {
      category = 'mindfulness'
    }

    if (!analysis.byType[category]) {
      analysis.byType[category] = []
    }
    analysis.byType[category].push(r.title)

    // Estimate effort based on measurable criteria
    const criteria = r.measurable_criteria.toLowerCase()
    if (criteria.includes('daily') || criteria.includes('every day')) {
      analysis.estimatedEffort[r.title] = 'high'
    } else if (criteria.includes('weekly') || criteria.includes('per week')) {
      analysis.estimatedEffort[r.title] = 'medium'
    } else {
      analysis.estimatedEffort[r.title] = 'low'
    }
  })

  // Detect potential dependencies
  resolutions.forEach((r1, i) => {
    resolutions.forEach((r2, j) => {
      if (i !== j && hasPotentialDependency(r1.title, r2.title)) {
        analysis.interdependencies.push([r1.title, r2.title])
      }
    })
  })

  return analysis
}

/**
 * Detect if one resolution might depend on another
 */
function hasPotentialDependency(resolution1: string, resolution2: string): boolean {
  const r1 = resolution1.toLowerCase()
  const r2 = resolution2.toLowerCase()

  // Health resolutions often support career/learning
  if ((r1.includes('exercise') || r1.includes('sleep')) && (r2.includes('learn') || r2.includes('work'))) {
    return true
  }

  // Mindfulness supports everything
  if (r1.includes('meditat') && !r2.includes('meditat')) {
    return true
  }

  return false
}

/**
 * Create a balanced prioritization strategy
 */
function createPrioritizationStrategy(
  resolutions: any[],
  analysis: any,
  timePerWeek: number,
  focusArea: string
): PrioritizationStrategy {
  const strategy: PrioritizationStrategy = {
    immediate: [],
    secondary: [],
    maintenance: [],
    dependencies: [],
    strategy: ''
  }

  // Allocate time based on focus area and effort
  const timeAllocation = allocateTime(resolutions, timePerWeek, focusArea, analysis)

  // Sort into priority tiers
  resolutions.forEach((r) => {
    const allocation = timeAllocation[r.title]
    const effort = analysis.estimatedEffort[r.title]

    if (allocation.hours > 5) {
      strategy.immediate.push({
        resolution: r.title,
        reason: allocation.reasoning,
        suggestedWeeklyHours: allocation.hours
      })
    } else if (allocation.hours > 2) {
      strategy.secondary.push({
        resolution: r.title,
        reason: allocation.reasoning,
        suggestedWeeklyHours: allocation.hours
      })
    } else {
      strategy.maintenance.push({
        resolution: r.title,
        reason: 'Maintain momentum with minimal effort to prevent losing progress',
        suggestedMinimalEffort: `${Math.round(allocation.hours * 60)} minutes per week`
      })
    }
  })

  // Add dependencies
  analysis.interdependencies.forEach(([primary, dependent]: [string, string]) => {
    strategy.dependencies.push({
      primary,
      dependent,
      reason: `Progress on "${primary}" will support progress on "${dependent}"`
    })
  })

  // Create narrative strategy
  strategy.strategy = generateStrategy(strategy, focusArea, resolutions.length)

  return strategy
}

/**
 * Intelligently allocate time across resolutions
 */
function allocateTime(
  resolutions: any[],
  timePerWeek: number,
  focusArea: string,
  analysis: any
): Record<string, { hours: number; reasoning: string }> {
  const allocation: Record<string, { hours: number; reasoning: string }> = {}
  const highEffortCount = resolutions.filter(
    (r) => analysis.estimatedEffort[r.title] === 'high'
  ).length

  // Base allocation: distribute time among high-effort items
  const baseTimePerHighEffort = (timePerWeek * 0.6) / Math.max(highEffortCount, 1)
  const remainingTime = timePerWeek * 0.4

  resolutions.forEach((r, index) => {
    const effort = analysis.estimatedEffort[r.title]
    let hours = 0
    let reasoning = ''

    if (effort === 'high') {
      hours = baseTimePerHighEffort
      reasoning = 'Daily or frequent commitment requires consistent time allocation'
    } else if (effort === 'medium') {
      hours = remainingTime / Math.max(resolutions.length - highEffortCount, 1)
      reasoning = 'Weekly commitment; balanced with other resolutions'
    } else {
      hours = Math.max(1, (remainingTime * 0.5) / resolutions.length)
      reasoning = 'Lower frequency allows minimal touch-in to maintain progress'
    }

    // Adjust based on focus area
    if (focusArea.toLowerCase().includes('health') && r.title.toLowerCase().includes('exercise')) {
      hours = Math.min(hours * 1.3, timePerWeek)
      reasoning = 'Increased allocation due to health focus area'
    }

    allocation[r.title] = {
      hours: Math.round(hours * 10) / 10, // Round to 1 decimal
      reasoning
    }
  })

  return allocation
}

/**
 * Generate a narrative strategy explanation
 */
function generateStrategy(
  strategy: Omit<PrioritizationStrategy, 'strategy' | 'questionsForClarification'>,
  focusArea: string,
  totalResolutions: number
): string {
  const immediate = strategy.immediate.length
  const secondary = strategy.secondary.length
  const maintenance = strategy.maintenance.length

  let narrative = `## Your Resolution Strategy\n\n`

  narrative += `**Focus Area:** ${focusArea}\n\n`

  narrative += `**Tier System:**\n`
  narrative += `- **Immediate Focus** (${immediate} resolutions): Your priority targets this period. Allocate peak energy here.\n`
  narrative += `- **Secondary** (${secondary} resolutions): Important but require less focused effort. Maintain steady progress.\n`
  narrative += `- **Maintenance** (${maintenance} resolutions): Keep momentum with minimal effort to prevent regression.\n\n`

  narrative += `**Approach:**\n`
  narrative += `This is a fluid prioritization system. It's okay to shift resolutions between tiers based on:\n`
  narrative += `- Life circumstances and unexpected changes\n`
  narrative += `- Momentum and how you're feeling\n`
  narrative += `- Progress on dependent resolutions\n`
  narrative += `- Seasonal or cyclical factors\n\n`

  narrative += `**Key Principle:** Progress on maintenance items (even 15 minutes) prevents the psychological burden of "falling off." `
  narrative += `Consistency beats perfection. You're building a sustainable lifestyle, not cramming everything at once.`

  if (strategy.dependencies.length > 0) {
    narrative += `\n\n**Resolution Dependencies:**\n`
    strategy.dependencies.forEach((dep) => {
      narrative += `- "${dep.primary}" supports "${dep.dependent}"\n`
    })
  }

  return narrative
}

/**
 * Generate clarifying questions to refine the strategy
 */
function generateClarifyingQuestions(resolutions: any[], analysis: any): string[] {
  const questions: string[] = []

  if (analysis.byType['health']) {
    questions.push('How much do health improvements impact your energy for other areas?')
  }

  if (analysis.byType['learning']) {
    questions.push('Are any of your learning goals connected to your career or other resolutions?')
  }

  if (resolutions.length > 3) {
    questions.push('Are there any resolutions you could temporarily pause without causing setback?')
  }

  questions.push('What would feel like "failure" vs "success" for this month?')
  questions.push('Are there external deadlines or commitments affecting your availability?')

  return questions
}
