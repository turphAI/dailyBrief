import React from 'react'
import { ChevronLeft, CheckCircle2, Trash2, Calendar, Target, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Resolution } from '../types/resolution'
import { getTierInfo } from '../utils/resolutionViz'

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
    <div className="flex flex-col h-full gap-4">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Resolutions</span>
      </button>

      {/* Header */}
      <div className="pb-3 border-b">
        <h2 className="text-lg font-semibold">
          {resolution.title}
        </h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6">
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
      <div className="flex gap-2 pt-4 border-t">
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
