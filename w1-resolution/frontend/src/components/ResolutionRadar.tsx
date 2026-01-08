import React from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ResolutionVisualizationData } from '../../types/resolution'

interface ResolutionRadarProps {
  data: ResolutionVisualizationData[]
  onResolutionClick?: (resolutionName: string) => void
}

/**
 * Radar chart visualization for resolutions
 * Shows each resolution as a data point, with distance from center = progress
 */
export default function ResolutionRadar({
  data,
  onResolutionClick,
}: ResolutionRadarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-48 bg-muted/30 rounded-lg">
        <p className="text-sm text-muted-foreground">No active resolutions yet</p>
      </div>
    )
  }

  // Truncate long names for the chart
  const chartData = data.map(item => ({
    ...item,
    shortName: item.name.length > 15 ? item.name.substring(0, 12) + '...' : item.name,
  }))

  return (
    <div className="w-full">
      <div style={{ width: '100%', height: '250px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <PolarAngleAxis 
              dataKey="shortName" 
              tick={{ 
                fontSize: 10, 
                fill: 'hsl(var(--muted-foreground))',
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fontSize: 9 }}
              stroke="hsl(var(--muted-foreground))"
              tickCount={5}
            />
            <Radar
              name="Progress"
              dataKey="progress"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }}
              isAnimationActive
              onClick={(e) => {
                if (e && e.name && onResolutionClick) {
                  const original = data.find(d => d.name.startsWith(e.name.replace('...', '')))
                  if (original) onResolutionClick(original.name)
                }
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={(value: any, name: any, props: any) => {
                const original = data.find(d => 
                  d.name.startsWith(props.payload.shortName.replace('...', ''))
                )
                return [`${value}%`, original?.name || props.payload.shortName]
              }}
              labelFormatter={() => ''}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
