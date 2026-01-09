import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, PieChart, PartyPopper, Settings2, Check, Brain } from 'lucide-react'
import ResolutionRadar from './ResolutionRadar'
import ResolutionDetailView from './ResolutionDetailView'
import InsightsView from './InsightsView'
import {
  resolutionToRadarData,
  categorizeTier,
  calculateProgress,
} from '../utils/resolutionViz'
import { calculateCadenceProgress } from '../types/resolution'

type ViewType = 'dashboard' | 'resolutions' | 'detail' | 'insights' | 'settings'
type NavState = 'collapsed' | 'transition' | 'open'

const TRANSITION_DURATION = 600 // ms

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
  const [navState, setNavState] = useState<NavState>(isExpanded ? 'open' : 'collapsed')
  
  const activeResolutions = resolutions.filter((r: any) => r.status === 'active')
  const completedResolutions = resolutions.filter((r: any) => r.status === 'completed')

  const radarData = resolutionToRadarData(activeResolutions)
  const selectedResolution = activeResolutions.find(
    (r: any) => r.id === selectedResolutionId
  )

  // Sync navState with isExpanded prop changes
  useEffect(() => {
    if (isExpanded && navState === 'collapsed') {
      setNavState('transition')
      setTimeout(() => setNavState('open'), TRANSITION_DURATION)
    } else if (!isExpanded && navState === 'open') {
      setNavState('transition')
      setTimeout(() => setNavState('collapsed'), TRANSITION_DURATION)
    }
  }, [isExpanded])

  const isClickable = navState !== 'transition'
  const isOpening = navState === 'transition' && isExpanded
  const isClosing = navState === 'transition' && !isExpanded

  // Handle nav icon click when collapsed (triggers expand + navigate)
  const handleNavClick = (view: ViewType) => {
    if (!isClickable) return
    
    if (navState === 'collapsed') {
      setCurrentView(view)
      setSelectedResolutionId(null)
      onToggleExpanded()
    } else if (navState === 'open') {
      setCurrentView(view)
      setSelectedResolutionId(null)
    }
  }

  const handleCollapseClick = () => {
    if (!isClickable) return
    onToggleExpanded()
  }

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

  // Determine visual state for animations
  const showAsOpen = navState === 'open' || isOpening
  const showAsClosed = navState === 'collapsed' || isClosing

  return (
    <div className="relative flex flex-col h-full bg-muted/50 overflow-hidden">
      {/* Navigation Container - Animates position */}
      <div 
        className="absolute inset-x-0 flex flex-col items-center z-10 transition-all ease-in-out"
        style={{
          transitionDuration: `${TRANSITION_DURATION}ms`,
          top: showAsOpen ? '0' : '50%',
          transform: showAsOpen ? 'translateY(0)' : 'translateY(-50%)',
        }}
      >
        {/* Nav Icons Container - Animates from vertical to horizontal */}
        <div 
          className="flex items-center p-2 transition-all ease-in-out"
          style={{
            transitionDuration: `${TRANSITION_DURATION}ms`,
            flexDirection: showAsOpen ? 'row' : 'column',
            gap: showAsOpen ? '8px' : '8px',
            borderBottom: showAsOpen ? '1px solid hsl(var(--border))' : 'none',
            width: showAsOpen ? '100%' : 'auto',
            justifyContent: showAsOpen ? 'flex-start' : 'center',
          }}
        >
          {/* Dashboard */}
          <button
            onClick={() => handleNavClick('dashboard')}
            disabled={!isClickable}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ease-in-out ${
              navState === 'open' && currentView === 'dashboard'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } ${!isClickable ? 'cursor-not-allowed opacity-70' : ''}`}
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
            title="Dashboard"
          >
            <PieChart className="w-5 h-5" />
          </button>

          {/* Resolutions */}
          <button
            onClick={() => handleNavClick('resolutions')}
            disabled={!isClickable}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ease-in-out ${
              navState === 'open' && (currentView === 'resolutions' || currentView === 'detail')
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } ${!isClickable ? 'cursor-not-allowed opacity-70' : ''}`}
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
            title="Resolutions"
          >
            <PartyPopper className="w-5 h-5" />
          </button>

          {/* Insights */}
          <button
            onClick={() => handleNavClick('insights')}
            disabled={!isClickable}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ease-in-out ${
              navState === 'open' && currentView === 'insights'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } ${!isClickable ? 'cursor-not-allowed opacity-70' : ''}`}
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
            title="Insights"
          >
            <Brain className="w-5 h-5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavClick('settings')}
            disabled={!isClickable}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ease-in-out ${
              navState === 'open' && currentView === 'settings'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } ${!isClickable ? 'cursor-not-allowed opacity-70' : ''}`}
            style={{ transitionDuration: `${TRANSITION_DURATION}ms` }}
            title="Settings"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={handleCollapseClick}
            disabled={!isClickable}
            className={`w-10 h-10 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-all ease-in-out ${
              !isClickable ? 'cursor-not-allowed opacity-70' : ''
            }`}
            style={{ 
              transitionDuration: `${TRANSITION_DURATION}ms`,
              marginLeft: showAsOpen ? 'auto' : '0',
              marginTop: showAsOpen ? '0' : '16px',
            }}
          >
            {showAsOpen ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area - Below nav when open */}
      <div 
        className="flex-1 overflow-hidden transition-all ease-in-out"
        style={{
          transitionDuration: `${TRANSITION_DURATION}ms`,
          opacity: navState === 'open' ? 1 : 0,
          paddingTop: navState === 'open' ? '60px' : '0',
        }}
      >
        {(navState === 'open' || navState === 'transition') && (
          <div className="h-full overflow-y-auto p-4">
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    Dashboard
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Overview of your resolution progress
                  </p>
                </div>

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

                {completedResolutions.length > 0 && (
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      🎉 {completedResolutions.length} resolution{completedResolutions.length !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                )}

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
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    Resolutions
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Click on a resolution to view details
                  </p>
                </div>

                {activeResolutions.length > 0 ? (
                  <div className="space-y-3">
                    {activeResolutions.map((resolution: any, index: number) => {
                      const tier = categorizeTier(resolution, activeResolutions, index)
                      const progress = calculateProgress(resolution)
                      const cadenceProgress = calculateCadenceProgress(resolution)
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
                              
                              {/* Cadence progress badge */}
                              {cadenceProgress && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                    cadenceProgress.isOnTrack 
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                                  }`}>
                                    {cadenceProgress.isOnTrack && <Check className="w-3 h-3" />}
                                    {cadenceProgress.completedCount}/{cadenceProgress.targetCount} {cadenceProgress.periodLabel}
                                  </span>
                                </div>
                              )}
                              
                              {/* Overall progress bar (only show if no cadence) */}
                              {!cadenceProgress && (
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
                              )}
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
                  console.log('Complete resolution:', id)
                }}
                onDelete={(id) => {
                  console.log('Delete resolution:', id)
                }}
              />
            )}

            {/* Insights View */}
            {currentView === 'insights' && <InsightsView />}

            {/* Settings View */}
            {currentView === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground mb-2">
                    Settings
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Configure your preferences
                  </p>
                </div>

                <div className="bg-background border rounded-lg p-8 text-center">
                  <Settings2 className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Settings coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
