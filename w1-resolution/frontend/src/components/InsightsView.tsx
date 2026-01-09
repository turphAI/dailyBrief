import { useState, useEffect } from 'react'
import { 
  Brain, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Bell, 
  Zap, 
  Smile,
  Loader2,
  AlertCircle,
  Lightbulb
} from 'lucide-react'

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

interface InsightsResponse {
  insights: UserInsights
  summary: {
    totalDataPoints: number
    insightsGenerated: number
    promptInsights: string[]
  }
}

const PERIOD_ICONS: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
  night: '🌙'
}

const SENTIMENT_CONFIG = {
  improving: { icon: '📈', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  stable: { icon: '➡️', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950' },
  declining: { icon: '📉', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950' }
}

export default function InsightsView() {
  const [insights, setInsights] = useState<UserInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/chat/analytics/insights')
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }
      
      const data: InsightsResponse = await response.json()
      setInsights(data.insights)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your patterns...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-destructive mb-2">Failed to load insights</p>
          <button 
            onClick={fetchInsights}
            className="text-xs text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!insights || insights.dataPoints < 5) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Insights
          </h2>
          <p className="text-xs text-muted-foreground">
            Personalized patterns and recommendations
          </p>
        </div>

        <div className="bg-background border rounded-lg p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground mb-2">
            Building Your Profile
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Keep logging activities and updates! Once you have more data, 
            personalized insights will appear here to help optimize your journey.
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            {insights?.dataPoints || 0} / 10 data points collected
          </div>
        </div>
      </div>
    )
  }

  const { bestDays, bestTimeOfDay, cadenceSuccess, nudgeEffectiveness, streaks, sentiment } = insights

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Insights
        </h2>
        <p className="text-xs text-muted-foreground">
          Based on {insights.dataPoints} data points
        </p>
      </div>

      {/* Key Insights Summary */}
      {insights.promptInsights.length > 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-medium text-violet-900 dark:text-violet-100">
              Key Patterns
            </span>
          </div>
          <ul className="space-y-2">
            {insights.promptInsights.slice(0, 4).map((insight, i) => (
              <li key={i} className="text-xs text-violet-800 dark:text-violet-200 flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Best Days */}
      {bestDays.length > 0 && (
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Most Active Days</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {bestDays.slice(0, 3).map((day) => (
              <div 
                key={day.dayOfWeek}
                className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {day.dayName} ({day.percentage}%)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Time of Day */}
      {bestTimeOfDay.length > 0 && (
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Peak Activity Times</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {bestTimeOfDay.map((period) => (
              <div 
                key={period.period}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50"
              >
                <span className="text-xs flex items-center gap-1.5">
                  <span>{PERIOD_ICONS[period.period]}</span>
                  <span className="capitalize">{period.period}</span>
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {period.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cadence Success */}
      {cadenceSuccess.length > 0 && (
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Cadence Success Rates</span>
          </div>
          <div className="space-y-2">
            {cadenceSuccess.map((rate) => (
              <div key={rate.period} className="flex items-center gap-3">
                <span className="text-xs w-16 capitalize">{rate.period}ly</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      rate.successRate >= 0.7 ? 'bg-emerald-500' : 
                      rate.successRate >= 0.4 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${rate.successRate * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-10 text-right">
                  {Math.round(rate.successRate * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaks */}
      {streaks.currentLongestStreak > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Current Streak
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {streaks.currentLongestStreak} periods
          </p>
          {streaks.resolutionWithStreak && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {streaks.resolutionWithStreak}
            </p>
          )}
        </div>
      )}

      {/* Nudge Effectiveness */}
      {nudgeEffectiveness.totalNudges >= 3 && (
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Reminder Effectiveness</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {Math.round(nudgeEffectiveness.effectivenessRate * 100)}%
              </p>
              <p className="text-xs text-muted-foreground">Lead to action</p>
            </div>
            <div className="flex-1 text-xs text-muted-foreground">
              {nudgeEffectiveness.nudgesLeadingToActivity} of {nudgeEffectiveness.totalNudges} reminders
              resulted in activity within 24 hours
            </div>
          </div>
        </div>
      )}

      {/* Sentiment */}
      <div className={`rounded-lg p-4 border ${SENTIMENT_CONFIG[sentiment.overall].bg}`}>
        <div className="flex items-center gap-2 mb-2">
          <Smile className={`w-4 h-4 ${SENTIMENT_CONFIG[sentiment.overall].color}`} />
          <span className={`text-sm font-medium ${SENTIMENT_CONFIG[sentiment.overall].color}`}>
            Mood Trend: {sentiment.overall.charAt(0).toUpperCase() + sentiment.overall.slice(1)}
          </span>
          <span className="text-lg">{SENTIMENT_CONFIG[sentiment.overall].icon}</span>
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-muted-foreground">Recent: </span>
            <span className="font-medium">{Math.round(sentiment.recentPositiveRate * 100)}% positive</span>
          </div>
          <div>
            <span className="text-muted-foreground">Overall: </span>
            <span className="font-medium">{Math.round(sentiment.historicalPositiveRate * 100)}% positive</span>
          </div>
        </div>
        {sentiment.strugglingResolutions.length > 0 && (
          <div className="mt-2 pt-2 border-t border-current/10">
            <p className="text-xs text-muted-foreground">
              Needs attention: {sentiment.strugglingResolutions.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground pt-2 border-t flex justify-between items-center">
        <span>Updated {new Date(insights.generatedAt).toLocaleTimeString()}</span>
        <button 
          onClick={fetchInsights}
          className="text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
    </div>
  )
}
