/**
 * Analytics Service - Tier 1 Smart Heuristics
 * 
 * Aggregates patterns from resolution data to generate personalized insights.
 * These insights are injected into the system prompt to make the AI "smarter"
 * without requiring actual ML training.
 * 
 * Patterns detected:
 * - Optimal activity completion times (day of week, rough time of day)
 * - Resolution success rates by cadence type
 * - Nudge effectiveness (did nudges lead to activity within 24h?)
 * - Streak/momentum patterns
 * - Sentiment trends over time
 */

import type { Resolution, NudgeRecord, ActivityCompletion, Update } from '../lib/db.js'

// ============================================================================
// Types
// ============================================================================

export interface TimePattern {
  dayOfWeek: number       // 0-6 (Sunday-Saturday)
  dayName: string
  count: number
  percentage: number
}

export interface TimeOfDayPattern {
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  count: number
  percentage: number
}

export interface CadenceSuccessRate {
  period: 'day' | 'week' | 'month'
  totalResolutions: number
  successfulResolutions: number  // Resolutions with >70% completion rate
  successRate: number
}

export interface NudgeEffectiveness {
  totalNudges: number
  nudgesLeadingToActivity: number   // Activity logged within 24h of nudge
  effectivenessRate: number
  bestNudgeTypes: Array<{
    type: NudgeRecord['type']
    count: number
    successRate: number
  }>
}

export interface StreakInsight {
  currentLongestStreak: number
  resolutionWithStreak: string | null
  averageStreakBeforeDrop: number   // How many consecutive completions before user typically misses
  streakVulnerabilityWindow: number // Days into streak when drops are most common
}

export interface SentimentTrend {
  overall: 'improving' | 'stable' | 'declining'
  recentPositiveRate: number   // Last 7 days
  historicalPositiveRate: number  // All time
  strugglingResolutions: string[] // Resolutions with recent struggling sentiment
}

export interface UserInsights {
  // When they're most active
  bestDays: TimePattern[]
  bestTimeOfDay: TimeOfDayPattern[]
  
  // What works for them
  cadenceSuccess: CadenceSuccessRate[]
  
  // How nudges perform
  nudgeEffectiveness: NudgeEffectiveness
  
  // Momentum patterns
  streaks: StreakInsight
  
  // Emotional trajectory
  sentiment: SentimentTrend
  
  // Summary for prompt injection
  promptInsights: string[]
  
  // Metadata
  dataPoints: number
  generatedAt: string
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze all resolution data to generate personalized insights.
 * Call this when building the system prompt.
 */
export function generateUserInsights(
  resolutions: Map<string, Resolution>,
  nudgeRecords: NudgeRecord[] = []
): UserInsights {
  const resolutionsList = Array.from(resolutions.values())
  
  // Gather all activity completions
  const allCompletions: Array<ActivityCompletion & { resolutionTitle: string }> = []
  const allUpdates: Array<Update & { resolutionId: string; resolutionTitle: string }> = []
  
  for (const resolution of resolutionsList) {
    if (resolution.activityCompletions) {
      for (const completion of resolution.activityCompletions) {
        allCompletions.push({ ...completion, resolutionTitle: resolution.title })
      }
    }
    if (resolution.updates) {
      for (const update of resolution.updates) {
        allUpdates.push({ 
          ...update, 
          resolutionId: resolution.id,
          resolutionTitle: resolution.title 
        })
      }
    }
  }
  
  const bestDays = analyzeBestDays(allCompletions)
  const bestTimeOfDay = analyzeBestTimeOfDay(allCompletions)
  const cadenceSuccess = analyzeCadenceSuccess(resolutionsList)
  const nudgeEffectiveness = analyzeNudgeEffectiveness(nudgeRecords, allCompletions)
  const streaks = analyzeStreaks(resolutionsList)
  const sentiment = analyzeSentiment(allUpdates)
  
  // Generate human-readable insights for prompt injection
  const promptInsights = generatePromptInsights({
    bestDays,
    bestTimeOfDay,
    cadenceSuccess,
    nudgeEffectiveness,
    streaks,
    sentiment
  })
  
  return {
    bestDays,
    bestTimeOfDay,
    cadenceSuccess,
    nudgeEffectiveness,
    streaks,
    sentiment,
    promptInsights,
    dataPoints: allCompletions.length + allUpdates.length,
    generatedAt: new Date().toISOString()
  }
}

// ============================================================================
// Individual Analysis Functions
// ============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function analyzeBestDays(completions: ActivityCompletion[]): TimePattern[] {
  if (completions.length === 0) return []
  
  const dayCounts = new Map<number, number>()
  
  for (const completion of completions) {
    const date = new Date(completion.timestamp)
    const day = date.getDay()
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
  }
  
  const total = completions.length
  const patterns: TimePattern[] = []
  
  for (const [day, count] of dayCounts.entries()) {
    patterns.push({
      dayOfWeek: day,
      dayName: DAY_NAMES[day],
      count,
      percentage: Math.round((count / total) * 100)
    })
  }
  
  // Sort by count descending
  return patterns.sort((a, b) => b.count - a.count)
}

function analyzeBestTimeOfDay(completions: ActivityCompletion[]): TimeOfDayPattern[] {
  if (completions.length === 0) return []
  
  const periodCounts = {
    morning: 0,    // 5am - 12pm
    afternoon: 0,  // 12pm - 5pm
    evening: 0,    // 5pm - 9pm
    night: 0       // 9pm - 5am
  }
  
  for (const completion of completions) {
    const date = new Date(completion.timestamp)
    const hour = date.getHours()
    
    if (hour >= 5 && hour < 12) {
      periodCounts.morning++
    } else if (hour >= 12 && hour < 17) {
      periodCounts.afternoon++
    } else if (hour >= 17 && hour < 21) {
      periodCounts.evening++
    } else {
      periodCounts.night++
    }
  }
  
  const total = completions.length
  const patterns: TimeOfDayPattern[] = Object.entries(periodCounts).map(([period, count]) => ({
    period: period as TimeOfDayPattern['period'],
    count,
    percentage: Math.round((count / total) * 100)
  }))
  
  return patterns.sort((a, b) => b.count - a.count)
}

function analyzeCadenceSuccess(resolutions: Resolution[]): CadenceSuccessRate[] {
  const stats = new Map<'day' | 'week' | 'month', { total: number; successful: number }>()
  
  for (const resolution of resolutions) {
    if (!resolution.cadence) continue
    
    const period = resolution.cadence.period
    const current = stats.get(period) || { total: 0, successful: 0 }
    current.total++
    
    // Calculate historical completion rate for this resolution
    const completionRate = calculateHistoricalCompletionRate(resolution)
    if (completionRate >= 0.7) {
      current.successful++
    }
    
    stats.set(period, current)
  }
  
  const results: CadenceSuccessRate[] = []
  for (const [period, data] of stats.entries()) {
    results.push({
      period,
      totalResolutions: data.total,
      successfulResolutions: data.successful,
      successRate: data.total > 0 ? Math.round((data.successful / data.total) * 100) / 100 : 0
    })
  }
  
  return results.sort((a, b) => b.successRate - a.successRate)
}

function calculateHistoricalCompletionRate(resolution: Resolution): number {
  if (!resolution.cadence || !resolution.activityCompletions) return 0
  
  const completions = resolution.activityCompletions
  if (completions.length === 0) return 0
  
  // Calculate how many periods have passed since creation
  const createdAt = new Date(resolution.createdAt)
  const now = new Date()
  const daysPassed = Math.ceil((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
  
  let expectedCompletions: number
  switch (resolution.cadence.period) {
    case 'day':
      expectedCompletions = daysPassed * resolution.cadence.frequency
      break
    case 'week':
      expectedCompletions = Math.ceil(daysPassed / 7) * resolution.cadence.frequency
      break
    case 'month':
      expectedCompletions = Math.ceil(daysPassed / 30) * resolution.cadence.frequency
      break
  }
  
  if (expectedCompletions === 0) return 1 // Too early to judge
  
  return Math.min(1, completions.length / expectedCompletions)
}

function analyzeNudgeEffectiveness(
  nudges: NudgeRecord[],
  completions: Array<ActivityCompletion & { resolutionTitle: string }>
): NudgeEffectiveness {
  if (nudges.length === 0) {
    return {
      totalNudges: 0,
      nudgesLeadingToActivity: 0,
      effectivenessRate: 0,
      bestNudgeTypes: []
    }
  }
  
  const typeStats = new Map<NudgeRecord['type'], { total: number; effective: number }>()
  let totalEffective = 0
  
  for (const nudge of nudges) {
    if (nudge.status !== 'delivered' && nudge.status !== 'responded') continue
    
    const deliveredAt = new Date(nudge.deliveredAt || nudge.scheduledAt)
    const window24h = new Date(deliveredAt.getTime() + 24 * 60 * 60 * 1000)
    
    // Check if any activity was logged for this resolution within 24h
    const hadActivityWithin24h = completions.some(c => {
      const completionTime = new Date(c.timestamp)
      return completionTime >= deliveredAt && completionTime <= window24h
    })
    
    // Update type stats
    const typeStat = typeStats.get(nudge.type) || { total: 0, effective: 0 }
    typeStat.total++
    if (hadActivityWithin24h) {
      typeStat.effective++
      totalEffective++
    }
    typeStats.set(nudge.type, typeStat)
  }
  
  const bestNudgeTypes = Array.from(typeStats.entries())
    .map(([type, stats]) => ({
      type,
      count: stats.total,
      successRate: stats.total > 0 ? Math.round((stats.effective / stats.total) * 100) / 100 : 0
    }))
    .sort((a, b) => b.successRate - a.successRate)
  
  return {
    totalNudges: nudges.length,
    nudgesLeadingToActivity: totalEffective,
    effectivenessRate: nudges.length > 0 ? Math.round((totalEffective / nudges.length) * 100) / 100 : 0,
    bestNudgeTypes
  }
}

function analyzeStreaks(resolutions: Resolution[]): StreakInsight {
  let longestCurrentStreak = 0
  let resolutionWithStreak: string | null = null
  const streakLengths: number[] = []
  const dropPoints: number[] = []
  
  for (const resolution of resolutions) {
    if (!resolution.cadence || !resolution.activityCompletions) continue
    
    const completions = resolution.activityCompletions
      .map(c => new Date(c.timestamp))
      .sort((a, b) => a.getTime() - b.getTime())
    
    if (completions.length < 2) continue
    
    // Calculate streaks based on cadence period
    const periodMs = resolution.cadence.period === 'day' 
      ? 24 * 60 * 60 * 1000
      : resolution.cadence.period === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000
    
    let currentStreak = 1
    let maxStreak = 1
    
    for (let i = 1; i < completions.length; i++) {
      const gap = completions[i].getTime() - completions[i - 1].getTime()
      
      // Allow some flexibility (1.5x the period)
      if (gap <= periodMs * 1.5) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        // Streak broken - record the drop point
        if (currentStreak > 1) {
          dropPoints.push(currentStreak)
          streakLengths.push(currentStreak)
        }
        currentStreak = 1
      }
    }
    
    // Check if current streak is still active (last completion within 1.5 periods)
    const lastCompletion = completions[completions.length - 1]
    const timeSinceLastCompletion = Date.now() - lastCompletion.getTime()
    if (timeSinceLastCompletion <= periodMs * 1.5) {
      if (currentStreak > longestCurrentStreak) {
        longestCurrentStreak = currentStreak
        resolutionWithStreak = resolution.title
      }
    }
    
    if (currentStreak > 1) {
      streakLengths.push(currentStreak)
    }
  }
  
  const averageStreak = streakLengths.length > 0
    ? Math.round(streakLengths.reduce((a, b) => a + b, 0) / streakLengths.length)
    : 0
  
  // Most common drop point
  const vulnerabilityWindow = dropPoints.length > 0
    ? Math.round(dropPoints.reduce((a, b) => a + b, 0) / dropPoints.length)
    : 0
  
  return {
    currentLongestStreak: longestCurrentStreak,
    resolutionWithStreak,
    averageStreakBeforeDrop: averageStreak,
    streakVulnerabilityWindow: vulnerabilityWindow
  }
}

function analyzeSentiment(updates: Array<Update & { resolutionId: string; resolutionTitle: string }>): SentimentTrend {
  if (updates.length === 0) {
    return {
      overall: 'stable',
      recentPositiveRate: 0,
      historicalPositiveRate: 0,
      strugglingResolutions: []
    }
  }
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  
  let recentPositive = 0
  let recentTotal = 0
  let allPositive = 0
  let allTotal = 0
  
  const recentStruggling = new Map<string, number>()
  
  for (const update of updates) {
    if (!update.sentiment) continue
    
    allTotal++
    if (update.sentiment === 'positive') allPositive++
    
    const updateTime = new Date(update.createdAt).getTime()
    if (updateTime >= sevenDaysAgo) {
      recentTotal++
      if (update.sentiment === 'positive') recentPositive++
      if (update.sentiment === 'struggling') {
        recentStruggling.set(
          update.resolutionTitle,
          (recentStruggling.get(update.resolutionTitle) || 0) + 1
        )
      }
    }
  }
  
  const recentRate = recentTotal > 0 ? recentPositive / recentTotal : 0
  const historicalRate = allTotal > 0 ? allPositive / allTotal : 0
  
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (recentTotal >= 3) {  // Only assess trend if we have enough recent data
    if (recentRate > historicalRate + 0.1) trend = 'improving'
    else if (recentRate < historicalRate - 0.1) trend = 'declining'
  }
  
  // Resolutions with 2+ struggling updates in the last week
  const strugglingResolutions = Array.from(recentStruggling.entries())
    .filter(([_, count]) => count >= 2)
    .map(([title]) => title)
  
  return {
    overall: trend,
    recentPositiveRate: Math.round(recentRate * 100) / 100,
    historicalPositiveRate: Math.round(historicalRate * 100) / 100,
    strugglingResolutions
  }
}

// ============================================================================
// Prompt Generation
// ============================================================================

function generatePromptInsights(data: {
  bestDays: TimePattern[]
  bestTimeOfDay: TimeOfDayPattern[]
  cadenceSuccess: CadenceSuccessRate[]
  nudgeEffectiveness: NudgeEffectiveness
  streaks: StreakInsight
  sentiment: SentimentTrend
}): string[] {
  const insights: string[] = []
  
  // Best days insight
  if (data.bestDays.length >= 2) {
    const topDays = data.bestDays.slice(0, 2).map(d => d.dayName)
    insights.push(`Turph is most active on ${topDays.join(' and ')} (${data.bestDays[0].percentage}% of activities).`)
  }
  
  // Best time of day
  if (data.bestTimeOfDay.length > 0 && data.bestTimeOfDay[0].percentage >= 40) {
    const best = data.bestTimeOfDay[0]
    insights.push(`Most activities are completed in the ${best.period} (${best.percentage}% of the time).`)
  }
  
  // Cadence success
  if (data.cadenceSuccess.length > 0) {
    const best = data.cadenceSuccess[0]
    const worst = data.cadenceSuccess[data.cadenceSuccess.length - 1]
    
    if (best.successRate >= 0.7 && best.totalResolutions >= 2) {
      insights.push(`${best.period.charAt(0).toUpperCase() + best.period.slice(1)}ly cadences work well for Turph (${Math.round(best.successRate * 100)}% success rate).`)
    }
    
    if (worst.successRate < 0.5 && worst.totalResolutions >= 2 && worst.period !== best.period) {
      insights.push(`${worst.period.charAt(0).toUpperCase() + worst.period.slice(1)}ly cadences tend to be harder to maintain (${Math.round(worst.successRate * 100)}% success rate).`)
    }
  }
  
  // Nudge effectiveness
  if (data.nudgeEffectiveness.totalNudges >= 5) {
    if (data.nudgeEffectiveness.effectivenessRate >= 0.5) {
      insights.push(`Nudges are effective - ${Math.round(data.nudgeEffectiveness.effectivenessRate * 100)}% lead to activity within 24 hours.`)
    } else if (data.nudgeEffectiveness.effectivenessRate < 0.3) {
      insights.push(`Nudges have low effectiveness (${Math.round(data.nudgeEffectiveness.effectivenessRate * 100)}%). Consider adjusting timing or frequency.`)
    }
    
    // Best nudge type
    if (data.nudgeEffectiveness.bestNudgeTypes.length > 0) {
      const best = data.nudgeEffectiveness.bestNudgeTypes[0]
      if (best.successRate >= 0.5 && best.count >= 3) {
        const typeLabel = best.type.replace('_', ' ')
        insights.push(`"${typeLabel}" nudges work best (${Math.round(best.successRate * 100)}% success).`)
      }
    }
  }
  
  // Streak insights
  if (data.streaks.currentLongestStreak >= 3 && data.streaks.resolutionWithStreak) {
    insights.push(`Currently on a ${data.streaks.currentLongestStreak}-period streak with "${data.streaks.resolutionWithStreak}" - encourage continuing!`)
  }
  
  if (data.streaks.streakVulnerabilityWindow >= 3 && data.streaks.streakVulnerabilityWindow <= 7) {
    insights.push(`Streaks typically break around the ${data.streaks.streakVulnerabilityWindow}-period mark - be extra encouraging around that time.`)
  }
  
  // Sentiment insights
  if (data.sentiment.overall === 'declining') {
    insights.push(`Recent sentiment is declining - be extra supportive and check in on blockers.`)
  } else if (data.sentiment.overall === 'improving') {
    insights.push(`Sentiment is improving recently - acknowledge and celebrate the positive momentum!`)
  }
  
  if (data.sentiment.strugglingResolutions.length > 0) {
    insights.push(`Watch for struggles with: ${data.sentiment.strugglingResolutions.join(', ')}.`)
  }
  
  return insights
}

// ============================================================================
// Helper: Build Insights Section for System Prompt
// ============================================================================

/**
 * Generate the personalized insights section for the system prompt.
 * Returns empty string if not enough data.
 */
export function buildInsightsPromptSection(insights: UserInsights): string {
  if (insights.dataPoints < 10 || insights.promptInsights.length === 0) {
    return '' // Not enough data yet
  }
  
  const lines = [
    '## Personalized Insights About Turph',
    'Based on historical patterns, here\'s what you know about Turph:',
    '',
    ...insights.promptInsights.map(i => `- ${i}`),
    '',
    'Use these insights to personalize your coaching approach.',
    ''
  ]
  
  return lines.join('\n')
}
