import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ResolutionVisualizationData } from '../../types/resolution'

interface ResolutionRadarProps {
  data: ResolutionVisualizationData[]
  onResolutionClick?: (resolutionName: string) => void
}

/**
 * Radar chart visualization for resolutions using shadcn/recharts
 * Shows each resolution as a data point, with distance from center = progress
 * Color indicates priority tier (immediate, secondary, maintenance)
 */
export default function ResolutionRadar({
  data,
  onResolutionClick,
}: ResolutionRadarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">No active resolutions yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--muted))" opacity={0.3} />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Radar
              name="Progress"
              dataKey="progress"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              isAnimationActive
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `${value}%`}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Tier Legend */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs text-muted-foreground">Immediate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">Secondary</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Maintenance</span>
        </div>
      </div>

      {/* Resolution Details Grid */}
      <div className="grid grid-cols-1 gap-2 text-xs">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/40 transition"
            onClick={() => onResolutionClick?.(item.name)}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="font-semibold min-w-[2rem] text-right">
                {item.progress}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
