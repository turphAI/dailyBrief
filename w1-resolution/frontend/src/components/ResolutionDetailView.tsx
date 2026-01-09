import React from 'react'
import { ChevronLeft, CheckCircle2, Trash2, Calendar, Target, Sparkles, TrendingUp, Trophy, Activity, Check } from 'lucide-react'
import { Button } from './ui/button'
import { Resolution, Milestone, Update, calculateCadenceProgress } from '../types/resolution'
import { getTierInfo } from '../utils/resolutionViz'

// Cadence Progress Section Component
function CadenceProgressSection({ resolution }: { resolution: Resolution }) {
  const cadenceProgress = calculateCadenceProgress(resolution)
  if (!cadenceProgress) return null
  
  const { completedCount, targetCount, isOnTrack, remainingCount, periodLabel } = cadenceProgress
  const progressPercent = Math.min(100, (completedCount / targetCount) * 100)
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Activity Progress</h3>
      </div>
      
      <div className={`p-4 rounded-lg border ${
        isOnTrack 
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800' 
          : 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-medium ${
            isOnTrack ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {isOnTrack ? '✓ On track!' : `${remainingCount} more to go`}
          </span>
          <span className={`text-lg font-bold ${
            isOnTrack ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {completedCount}/{targetCount}
          </span>
        </div>
        
        <div className="w-full h-2.5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all rounded-full ${
              isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <p className="text-xs mt-2 opacity-70">
          {resolution.cadence?.description || `${targetCount}x ${resolution.cadence?.period}`} • {periodLabel}
        </p>
      </div>
    </div>
  )
}

// Milestones Section Component
function MilestonesSection({ milestones }: { milestones: Milestone[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Milestones</h3>
      </div>
      
      <div className="space-y-2">
        {milestones.map((milestone) => {
          const isComplete = milestone.completedAt !== undefined
          const progressPercent = Math.min(100, (milestone.current / milestone.target) * 100)
          
          return (
            <div 
              key={milestone.id}
              className={`p-3 rounded-lg border ${
                isComplete 
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm font-medium flex items-center gap-1.5 ${
                  isComplete ? 'text-emerald-700 dark:text-emerald-300' : ''
                }`}>
                  {isComplete && <Check className="w-3.5 h-3.5" />}
                  {milestone.title}
                </span>
                <span className={`text-sm font-semibold ${
                  isComplete ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
                }`}>
                  {milestone.current}/{milestone.target}
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    isComplete ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              
              {milestone.unit && (
                <p className="text-xs text-muted-foreground mt-1">
                  {milestone.unit}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Activity History Section Component  
function ActivityHistorySection({ resolution }: { resolution: Resolution }) {
  const completions = resolution.activityCompletions || []
  if (completions.length === 0) return null
  
  // Sort by most recent first and take last 5
  const recentCompletions = [...completions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Recent Activity</h3>
      </div>
      
      <div className="space-y-2">
        {recentCompletions.map((completion) => {
          const date = new Date(completion.timestamp)
          const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
          const formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          })
          
          return (
            <div 
              key={completion.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {completion.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formattedDate} at {formattedTime}
                </p>
              </div>
            </div>
          )
        })}
        
        {completions.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            + {completions.length - 5} more activities
          </p>
        )}
      </div>
    </div>
  )
}

// Updates History Section Component (for task-based resolutions)
function UpdatesHistorySection({ resolution }: { resolution: Resolution }) {
  const updates = resolution.updates || []
  if (updates.length === 0) return null
  
  // Sort by most recent first
  const recentUpdates = [...updates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)
  
  const typeConfig: Record<string, { icon: string; color: string }> = {
    milestone: { icon: '🎯', color: 'bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400' },
    progress: { icon: '📈', color: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400' },
    setback: { icon: '⚠️', color: 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400' },
    note: { icon: '📝', color: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' },
    check_in_response: { icon: '💬', color: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400' }
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Recent Updates</h3>
      </div>
      
      <div className="space-y-2">
        {recentUpdates.map((update) => {
          const date = new Date(update.createdAt)
          const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
          const config = typeConfig[update.type] || typeConfig.note
          
          return (
            <div 
              key={update.id}
              className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {update.content}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formattedDate}
                  </span>
                  {update.progressDelta !== undefined && update.progressDelta > 0 && (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      +{update.progressDelta}%
                    </span>
                  )}
                  {update.sentiment && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      update.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                      update.sentiment === 'struggling' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {update.sentiment}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {updates.length > 6 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            + {updates.length - 6} more updates
          </p>
        )}
      </div>
    </div>
  )
}

interface ResolutionDetailViewProps {
  resolution: Resolution
  tier: 'immediate' | 'secondary' | 'maintenance'
  progress: number
  onBack: () => void
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ResolutionDetailView({
  resolution,
  tier,
  progress,
  onBack,
  onComplete,
  onDelete,
}: ResolutionDetailViewProps) {
  const tierInfo = getTierInfo(tier)
  const isCompleted = resolution.status === 'completed'
  const createdDate = new Date(resolution.createdAt)
  const daysActive = Math.floor(
    (new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  const tierColors = {
    immediate: 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-100',
    secondary: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100',
    maintenance: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100',
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit flex-shrink-0"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Resolutions</span>
      </button>

      {/* Header */}
      <div className="pb-3 border-b flex-shrink-0">
        <h2 className="text-lg font-semibold">
          {resolution.title}
        </h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
        {/* Tier Badge */}
        <div
          className={`p-3 rounded-lg border space-y-2 ${tierColors[tier]}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{tierInfo.icon}</span>
            <span className="font-semibold">{tierInfo.label}</span>
          </div>
          <p className="text-sm">{tierInfo.description}</p>
        </div>

        {/* Cadence Progress (if resolution has cadence) */}
        {resolution.cadence && (
          <CadenceProgressSection resolution={resolution} />
        )}

        {/* Milestones (if any) */}
        {resolution.milestones && resolution.milestones.length > 0 && (
          <MilestonesSection milestones={resolution.milestones} />
        )}

        {/* Progress */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Progress</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Overall</span>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity (for cadence-based resolutions with completions) - MOVED UP */}
        {resolution.activityCompletions && resolution.activityCompletions.length > 0 && (
          <ActivityHistorySection resolution={resolution} />
        )}

        {/* Recent Updates (for task-based resolutions) - MOVED UP for visibility */}
        {resolution.updates && resolution.updates.length > 0 && (
          <UpdatesHistorySection resolution={resolution} />
        )}

        {/* Measurable Criteria */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Measurable Criteria</h3>
          </div>
          <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            {resolution.measurable_criteria}
          </p>
        </div>

        {/* Context */}
        {resolution.context && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Context</h3>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              {resolution.context}
            </p>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Timeline</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">
                {createdDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days Active</span>
              <span className="font-medium">{daysActive} days</span>
            </div>
            {isCompleted && resolution.completedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {new Date(resolution.completedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tips based on tier */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Tips</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            {tier === 'immediate' && (
              <>
                <li>✓ Schedule specific times for this goal</li>
                <li>✓ Track progress closely</li>
                <li>✓ This is your priority - give it your peak energy</li>
              </>
            )}
            {tier === 'secondary' && (
              <>
                <li>✓ Build it into your routine gradually</li>
                <li>✓ Consistency matters more than intensity</li>
                <li>✓ Support your immediate focus by working on this steadily</li>
              </>
            )}
            {tier === 'maintenance' && (
              <>
                <li>✓ Even 15 minutes helps maintain momentum</li>
                <li>✓ Prevents regression and psychological burden</li>
                <li>✓ Can shift up when circumstances improve</li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t flex-shrink-0">
        {!isCompleted && (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onComplete?.(resolution.id)}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        )}
        {isCompleted && (
          <div className="flex-1 flex items-center justify-center text-sm font-medium text-green-600">
            ✓ Completed
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete?.(resolution.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
