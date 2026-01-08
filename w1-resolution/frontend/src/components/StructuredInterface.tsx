import { useState } from 'react'
import { ChevronLeft, ChevronRight, PieChart, ListTodo } from 'lucide-react'
import ResolutionRadar from './ResolutionRadar'
import ResolutionDetailView from './ResolutionDetailView'
import {
  resolutionToRadarData,
  calculateOverallHealth,
  categorizeTier,
  calculateProgress,
} from '../utils/resolutionViz'

type ViewType = 'dashboard' | 'resolutions' | 'detail'

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
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
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
      setCurrentView('detail')
    }
  }

  const handleResolutionSelect = (id: string) => {
    setSelectedResolutionId(id)
    setCurrentView('detail')
  }

  const handleBackToResolutions = () => {
    setSelectedResolutionId(null)
    setCurrentView('resolutions')
  }

  return (
    <div className="flex flex-col h-full bg-muted/50">
      {/* Navigation - Always Visible */}
      <div className="flex flex-col items-center gap-2 p-2 border-b">
        {/* Dashboard Nav */}
        <button
          onClick={() => {
            setCurrentView('dashboard')
            setSelectedResolutionId(null)
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
            currentView === 'dashboard'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          title="Dashboard"
        >
          <PieChart className="w-5 h-5" />
        </button>

        {/* Resolutions Nav */}
        <button
          onClick={() => {
            setCurrentView('resolutions')
            setSelectedResolutionId(null)
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
            currentView === 'resolutions' || currentView === 'detail'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
          title="Resolutions"
        >
          <ListTodo className="w-5 h-5" />
        </button>

        {/* Expand/Collapse Toggle */}
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
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Header */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">
                  Dashboard
                </h2>
                <p className="text-xs text-muted-foreground">
                  Overview of your resolution progress
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
                  ✨ Use the conversational interface to manage your resolutions.
                </p>
              </div>
            </div>
          )}

          {/* Resolutions List View */}
          {currentView === 'resolutions' && (
            <div className="space-y-4">
              {/* Resolutions Header */}
              <div>
                <h2 className="text-base font-semibold text-foreground mb-2">
                  Resolutions
                </h2>
                <p className="text-xs text-muted-foreground">
                  Click on a resolution to view details
                </p>
              </div>

              {/* Resolution List */}
              {activeResolutions.length > 0 ? (
                <div className="space-y-3">
                  {activeResolutions.map((resolution: any, index: number) => {
                    const tier = categorizeTier(resolution, activeResolutions, index)
                    const progress = calculateProgress(resolution)
                    const tierColors = {
                      immediate: 'bg-orange-500',
                      secondary: 'bg-blue-500',
                      maintenance: 'bg-green-500',
                    }
                    
                    return (
                      <button
                        key={resolution.id}
                        onClick={() => handleResolutionSelect(resolution.id)}
                        className="w-full text-left bg-background border rounded-lg p-3 hover:border-primary/50 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${tierColors[tier]}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {resolution.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8">
                                {progress}%
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </button>
                    )
                  })}
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

              {/* Completed Resolutions */}
              {completedResolutions.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Completed ({completedResolutions.length})
                  </h3>
                  <div className="space-y-2">
                    {completedResolutions.map((resolution: any) => (
                      <div
                        key={resolution.id}
                        className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2 flex items-center gap-2"
                      >
                        <span className="text-green-500">✓</span>
                        <span className="truncate">{resolution.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detail View */}
          {currentView === 'detail' && selectedResolution && (
            <ResolutionDetailView
              resolution={selectedResolution}
              tier={categorizeTier(
                selectedResolution,
                activeResolutions,
                activeResolutions.findIndex((r) => r.id === selectedResolution.id)
              )}
              progress={calculateProgress(selectedResolution)}
              onBack={handleBackToResolutions}
              onComplete={(id) => {
                // TODO: Implement complete via API
                console.log('Complete resolution:', id)
              }}
              onDelete={(id) => {
                // TODO: Implement delete via API
                console.log('Delete resolution:', id)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
