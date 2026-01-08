import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './ui/button'
import ResolutionRadar from './ResolutionRadar'
import ResolutionDetailView from './ResolutionDetailView'
import {
  resolutionToRadarData,
  calculateOverallHealth,
  categorizeTier,
  calculateProgress,
} from '../utils/resolutionViz'

interface StructuredInterfaceProps {
  resolutions: any[]
  isExpanded: boolean
  onToggleExpanded: () => void
}

export default function StructuredInterface({
  resolutions,
  isExpanded,
  onToggleExpanded,
}: StructuredInterfaceProps) {
  const [selectedResolutionId, setSelectedResolutionId] = useState<string | null>(null)
  const activeResolutions = resolutions.filter((r: any) => r.status === 'active')
  const completedResolutions = resolutions.filter((r: any) => r.status === 'completed')

  const radarData = resolutionToRadarData(activeResolutions)
  const health = calculateOverallHealth(activeResolutions)
  const selectedResolution = activeResolutions.find(
    (r: any) => r.id === selectedResolutionId
  )

  const handleResolutionClick = (resolutionName: string) => {
    const resolution = activeResolutions.find((r: any) =>
      r.title.toLowerCase().includes(resolutionName.toLowerCase())
    )
    if (resolution) {
      setSelectedResolutionId(resolution.id)
    }
  }

  return (
    <div className="flex flex-col h-full bg-muted/50">
      {/* Toggle Button Stack - Always Visible */}
      <div className="flex flex-col items-center gap-2 p-2 border-b">
        {activeResolutions.map((resolution: any) => (
          <button
            key={resolution.id}
            onClick={() => setSelectedResolutionId(resolution.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition ${
              selectedResolutionId === resolution.id
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title={resolution.title}
          >
            {resolution.title.charAt(0).toUpperCase()}
          </button>
        ))}

        <button
          onClick={onToggleExpanded}
          className="w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition mt-auto"
        >
          {isExpanded ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Detail View or Overview */}
          {selectedResolution ? (
            <ResolutionDetailView
              resolution={selectedResolution}
              tier={categorizeTier(
                selectedResolution,
                activeResolutions,
                activeResolutions.findIndex((r) => r.id === selectedResolution.id)
              )}
              progress={calculateProgress(selectedResolution)}
              onBack={() => setSelectedResolutionId(null)}
              onComplete={(id) => {
                // TODO: Implement complete via API
                console.log('Complete resolution:', id)
              }}
              onDelete={(id) => {
                // TODO: Implement delete via API
                console.log('Delete resolution:', id)
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Overview Header */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">
                  Your Resolutions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click on a resolution to view details
                </p>
              </div>

              {/* Health Summary */}
              {activeResolutions.length > 0 && (
                <div className="bg-background border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Overall Progress
                    </span>
                    <span className="text-base font-semibold text-primary">
                      {health.averageProgress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${health.averageProgress}%` }}
                    />
                  </div>

                  {/* Tier Breakdown */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {health.immediateCount}
                      </div>
                      <div className="text-muted-foreground">Immediate</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {health.secondaryCount}
                      </div>
                      <div className="text-muted-foreground">Secondary</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">
                        {health.maintenanceCount}
                      </div>
                      <div className="text-muted-foreground">Maintenance</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Radar Chart */}
              {activeResolutions.length > 0 ? (
                <div>
                  <ResolutionRadar
                    data={radarData}
                    onResolutionClick={handleResolutionClick}
                  />
                </div>
              ) : (
                <div className="bg-background border rounded-lg p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No active resolutions yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create one through the chat to get started
                  </p>
                </div>
              )}

              {/* Completed Count */}
              {completedResolutions.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    🎉 {completedResolutions.length} resolution{completedResolutions.length !== 1 ? 's' : ''} completed
                  </p>
                </div>
              )}

              {/* Help Text */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>
                  ✨ Use the conversational interface to manage your resolutions. This panel shows your progress overview.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

