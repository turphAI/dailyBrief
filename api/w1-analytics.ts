/**
 * Analytics Insights API Endpoint
 * 
 * Generates user insights from resolution and nudge data.
 * GET /api/chat/analytics/insights
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  loadResolutions,
  loadNudgesForResolution,
  DatabaseError,
  type Resolution,
  type NudgeRecord,
  type Update
} from './lib/db'

// ============================================================================
// Types
// ============================================================================

interface TimePattern {
  dayOfWeek: number
  dayName: string
  count: number
  percentage: number
}

interface TimeOfDayPattern {
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  count: number
  percentage: number
}

interface CadenceSuccessRate {
  period: 'day' | 'week' | 'month'
  totalResolutions: number
  successfulResolutions: number
  successRate: number
}

interface NudgeEffectiveness {
  totalNudges: number
  nudgesLeadingToActivity: number
  effectivenessRate: number
  bestNudgeTypes: Array<{
    type: string
    count: number
    successRate: number
  }>
}

interface StreakInsight {
  currentLongestStreak: number
  resolutionWithStreak: string | null
  averageStreakBeforeDrop: number
  streakVulnerabilityWindow: number
}

interface SentimentTrend {
  overall: 'improving' | 'stable' | 'declining'
  recentPositiveRate: number
  historicalPositiveRate: number
  strugglingResolutions: string[]
}

interface UserInsights {
  bestDays: TimePattern[]
  bestTimeOfDay: TimeOfDayPattern[]
  cadenceSuccess: CadenceSuccessRate[]
  nudgeEffectiveness: NudgeEffectiveness
  streaks: StreakInsight
  sentiment: SentimentTrend
  promptInsights: string[]
  dataPoints: number
  generatedAt: string
}

// ============================================================================
// Analytics Functions
// ============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function analyzeBestDays(updates: Update[]): TimePattern[] {
  if (updates.length === 0) return []
  
  const dayCounts = new Map<number, number>()
  
  for (const update of updates) {
    const date = new Date(update.createdAt)
    const day = date.getDay()
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
  }
  
  const total = updates.length
  const patterns: TimePattern[] = []
  
  for (const [day, count] of dayCounts.entries()) {
    patterns.push({
      dayOfWeek: day,
      dayName: DAY_NAMES[day],
      count,
      percentage: Math.round((count / total) * 100)
    })
  }
  
  return patterns.sort((a, b) => b.count - a.count)
}

function analyzeBestTimeOfDay(updates: Update[]): TimeOfDayPattern[] {
  if (updates.length === 0) return []
  
  const periodCounts = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0
  }
  
  for (const update of updates) {
    const date = new Date(update.createdAt)
    const hour = date.getHours()
    
    if (hour >= 5 && hour < 12) periodCounts.morning++
    else if (hour >= 12 && hour < 17) periodCounts.afternoon++
    else if (hour >= 17 && hour < 21) periodCounts.evening++
    else periodCounts.night++
  }
  
  const total = updates.length
  return Object.entries(periodCounts)
    .map(([period, count]) => ({
      period: period as TimeOfDayPattern['period'],
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
}

function analyzeCadenceSuccess(resolutions: Resolution[]): CadenceSuccessRate[] {
  // Simple implementation - count resolutions with regular updates
  const weeklyResolutions = resolutions.filter(r => r.status === 'active')
  const successfulCount = weeklyResolutions.filter(r => {
    const updates = r.updates || []
    const recentUpdates = updates.filter(u => {
      const dayAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
      return new Date(u.createdAt).getTime() > dayAgo
    })
    return recentUpdates.length > 0
  }).length
  
  if (weeklyResolutions.length === 0) return []
  
  return [{
    period: 'week',
    totalResolutions: weeklyResolutions.length,
    successfulResolutions: successfulCount,
    successRate: Math.round((successfulCount / weeklyResolutions.length) * 100) / 100
  }]
}

function analyzeNudgeEffectiveness(
  nudges: NudgeRecord[],
  updates: Update[]
): NudgeEffectiveness {
  if (nudges.length === 0) {
    return {
      totalNudges: 0,
      nudgesLeadingToActivity: 0,
      effectivenessRate: 0,
      bestNudgeTypes: []
    }
  }
  
  const typeStats = new Map<string, { total: number; effective: number }>()
  let totalEffective = 0
  
  for (const nudge of nudges) {
    if (nudge.status !== 'delivered' && nudge.status !== 'responded') continue
    
    const deliveredAt = new Date(nudge.deliveredAt || nudge.scheduledAt)
    const window24h = new Date(deliveredAt.getTime() + 24 * 60 * 60 * 1000)
    
    const hadActivityWithin24h = updates.some(u => {
      const updateTime = new Date(u.createdAt)
      return updateTime >= deliveredAt && updateTime <= window24h
    })
    
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
  // Simplified streak analysis
  let longestCurrentStreak = 0
  let resolutionWithStreak: string | null = null
  
  for (const resolution of resolutions) {
    const updates = resolution.updates || []
    if (updates.length < 2) continue
    
    // Count recent consecutive days with updates
    const sortedUpdates = [...updates]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    let streak = 1
    for (let i = 1; i < sortedUpdates.length && i < 7; i++) {
      const prevDate = new Date(sortedUpdates[i - 1].createdAt)
      const currDate = new Date(sortedUpdates[i].createdAt)
      const dayDiff = Math.abs(prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000)
      
      if (dayDiff <= 2) {
        streak++
      } else {
        break
      }
    }
    
    if (streak > longestCurrentStreak) {
      longestCurrentStreak = streak
      resolutionWithStreak = resolution.title
    }
  }
  
  return {
    currentLongestStreak: longestCurrentStreak,
    resolutionWithStreak,
    averageStreakBeforeDrop: 0,
    streakVulnerabilityWindow: 0
  }
}

function analyzeSentiment(updates: Update[]): SentimentTrend {
  if (updates.length === 0) {
    return {
      overall: 'stable',
      recentPositiveRate: 0,
      historicalPositiveRate: 0,
      strugglingResolutions: []
    }
  }
  
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  
  let recentPositive = 0
  let recentTotal = 0
  let allPositive = 0
  let allTotal = 0
  
  for (const update of updates) {
    if (!update.sentiment) continue
    
    allTotal++
    if (update.sentiment === 'positive') allPositive++
    
    const updateTime = new Date(update.createdAt).getTime()
    if (updateTime >= sevenDaysAgo) {
      recentTotal++
      if (update.sentiment === 'positive') recentPositive++
    }
  }
  
  const recentRate = recentTotal > 0 ? recentPositive / recentTotal : 0
  const historicalRate = allTotal > 0 ? allPositive / allTotal : 0
  
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (recentTotal >= 3) {
    if (recentRate > historicalRate + 0.1) trend = 'improving'
    else if (recentRate < historicalRate - 0.1) trend = 'declining'
  }
  
  return {
    overall: trend,
    recentPositiveRate: Math.round(recentRate * 100) / 100,
    historicalPositiveRate: Math.round(historicalRate * 100) / 100,
    strugglingResolutions: []
  }
}

function generatePromptInsights(data: {
  bestDays: TimePattern[]
  bestTimeOfDay: TimeOfDayPattern[]
  cadenceSuccess: CadenceSuccessRate[]
  nudgeEffectiveness: NudgeEffectiveness
  streaks: StreakInsight
  sentiment: SentimentTrend
}): string[] {
  const insights: string[] = []
  
  if (data.bestDays.length >= 2) {
    const topDays = data.bestDays.slice(0, 2).map(d => d.dayName)
    insights.push(`Turph is most active on ${topDays.join(' and ')} (${data.bestDays[0].percentage}% of activities).`)
  }
  
  if (data.bestTimeOfDay.length > 0 && data.bestTimeOfDay[0].percentage >= 40) {
    const best = data.bestTimeOfDay[0]
    insights.push(`Most activities are completed in the ${best.period} (${best.percentage}% of the time).`)
  }
  
  if (data.nudgeEffectiveness.totalNudges >= 3) {
    if (data.nudgeEffectiveness.effectivenessRate >= 0.5) {
      insights.push(`Nudges are effective - ${Math.round(data.nudgeEffectiveness.effectivenessRate * 100)}% lead to activity within 24 hours.`)
    }
  }
  
  if (data.streaks.currentLongestStreak >= 3 && data.streaks.resolutionWithStreak) {
    insights.push(`Currently on a ${data.streaks.currentLongestStreak}-day streak with "${data.streaks.resolutionWithStreak}" - keep it up!`)
  }
  
  if (data.sentiment.overall === 'improving') {
    insights.push(`Sentiment is improving recently - great momentum!`)
  } else if (data.sentiment.overall === 'declining') {
    insights.push(`Recent sentiment is declining - consider checking in on blockers.`)
  }
  
  return insights
}

function generateUserInsights(
  resolutions: Resolution[],
  nudgeRecords: NudgeRecord[]
): UserInsights {
  // Gather all updates
  const allUpdates: Update[] = []
  for (const resolution of resolutions) {
    if (resolution.updates) {
      allUpdates.push(...resolution.updates)
    }
  }
  
  const bestDays = analyzeBestDays(allUpdates)
  const bestTimeOfDay = analyzeBestTimeOfDay(allUpdates)
  const cadenceSuccess = analyzeCadenceSuccess(resolutions)
  const nudgeEffectiveness = analyzeNudgeEffectiveness(nudgeRecords, allUpdates)
  const streaks = analyzeStreaks(resolutions)
  const sentiment = analyzeSentiment(allUpdates)
  
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
    dataPoints: allUpdates.length + resolutions.length,
    generatedAt: new Date().toISOString()
  }
}

// ============================================================================
// API Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'GET') {
    try {
      // Load resolutions
      let resolutions: Map<string, Resolution>
      try {
        resolutions = await loadResolutions()
      } catch (error) {
        if (error instanceof DatabaseError) {
          console.error('[Analytics] Database error:', error.details)
          return res.status(503).json({
            error: 'Database unavailable',
            details: error.details,
            code: error.code
          })
        }
        throw error
      }
      
      const resolutionsList = Array.from(resolutions.values())
      
      // Load all nudge records
      const allNudgeRecords: NudgeRecord[] = []
      for (const resolution of resolutionsList) {
        try {
          const nudges = await loadNudgesForResolution(resolution.id)
          allNudgeRecords.push(...nudges)
        } catch (e) {
          // Continue if nudges fail to load for one resolution
          console.error(`[Analytics] Failed to load nudges for ${resolution.id}:`, e)
        }
      }
      
      // Generate insights
      const insights = generateUserInsights(resolutionsList, allNudgeRecords)
      
      console.log(`[Analytics] Generated insights from ${resolutionsList.length} resolutions, ${allNudgeRecords.length} nudges`)
      
      return res.status(200).json({
        insights,
        summary: {
          totalDataPoints: insights.dataPoints,
          insightsGenerated: insights.promptInsights.length,
          promptInsights: insights.promptInsights
        }
      })
    } catch (error) {
      console.error('[Analytics] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      return res.status(500).json({
        error: 'Failed to generate insights',
        details: errorMessage
      })
    }
  }

  return res.status(405).json({
    error: 'Method not allowed',
    allowed: ['GET', 'OPTIONS']
  })
}
