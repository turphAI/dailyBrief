# Structured Interface: Resolution Visualization & Management

## Overview

The Structured Interface (right panel) provides a visual, non-list-based view of your resolutions. Instead of ranking them hierarchically in a list, it uses:

- **Radar Chart** - Shows all resolutions at a glance with progress visualization
- **Tier System** - Immediate/Secondary/Maintenance organizing without judgment
- **Detail View** - Deep dive into individual resolutions
- **Health Dashboard** - Overall progress summary

## Architecture

### Components

```
StructuredInterface.tsx (Main Container)
├── ResolutionRadar.tsx (Overview - Radar Chart)
├── ResolutionDetailView.tsx (Detail - Single Resolution)
└── UI Components (Button, custom layouts)

Utilities:
└── resolutionViz.ts (Calculations & data transformation)
```

### Data Flow

```
Resolutions (from props)
    ↓
resolutionToRadarData()
    ↓
ResolutionRadar (visualization)
    ↓
User clicks resolution
    ↓
ResolutionDetailView (detail modal)
```

## Features

### 1. **Always-Visible Toggle Buttons** (Collapsed State)

```
┌─────────────┐
│ [E] Exercise│  ← Resolution initials
│ [R] Reading │     (clickable)
│ [S] Spanish │
│ [M] Meditat │
│     ◀       │  ← Toggle to expand
└─────────────┘
```

**Features:**
- Shows initial letter of each resolution
- Highlight selected resolution
- Click to view detail
- Toggle expand/collapse with button

### 2. **Radar Chart Overview** (Expanded State)

When expanded, you see:

```
Radar Chart
├── Axes = Resolutions
├── Distance from center = Progress (0-100%)
├── Each point = one resolution
└── Connected line shows overall health

Legend
├── Color = Tier (Orange/Blue/Green)
├── Progress bar = % complete
└── Clickable to view details
```

**What it shows:**
- All resolutions at once
- Progress for each (non-judgmental visualization)
- No ranking - just different visualization
- Can click any resolution to see details

### 3. **Detail View** (Click Resolution)

When you click a resolution:

```
< Resolution Title
┌──────────────────┐
│ [🎯] Immediate Focus
│ Your priority targets
│
│ Progress: 35%
│ ████░░░░░░░
│
│ Target: [measurable criteria]
│ Context: [why it matters]
│
│ Created: Jan 8, 2026
│ Days Active: 5 days
│
│ [✓ Mark Complete] [🗑 Delete]
└──────────────────┘
```

**Shows:**
- Resolution title & tier
- Tier badge with explanation
- Progress bar
- Measurable criteria
- Context (why it matters)
- Timeline info
- Action buttons
- Tier-specific tips

### 4. **Health Dashboard** (Overview)

Summary of overall health:

```
Overall Progress: 42%
████████░░░

Tier Breakdown:
[2 Immediate] [2 Secondary] [1 Maintenance]
```

## How Progress is Calculated

Since we don't have explicit progress tracking yet, progress is estimated based on:

1. **Daily resolutions**: ~1.5% per day (up to 50%)
2. **Weekly resolutions**: ~2.9% per week (up to 50%)
3. **Monthly resolutions**: ~0.5% per day (up to 40%)
4. **Yearly resolutions**: ~0.08% per day (up to 50%)

**Example:**
- Created 5 days ago
- Daily frequency → 5 × 1.5% = 7.5% progress
- Weekly frequency → (5/7) × 20% = 14% progress

This is **heuristic and will improve** when we add explicit progress tracking.

## How Tiers Are Assigned

Currently (future: will come from backend prioritizeResolutions tool):

- **Immediate Focus**: First 1-2 resolutions
- **Secondary**: Next 2-3 resolutions
- **Maintenance**: Remaining resolutions

This is simple and will be replaced with the intelligent prioritization from your backend tool.

## Tier System

### 🎯 Immediate Focus
- **What**: Your priority targets - give these peak energy
- **Time**: 5+ hours/week
- **Effort**: Frequent engagement
- **Tips**: Schedule, track closely, prioritize

### 📈 Secondary
- **What**: Steady progress while focusing on immediate goals
- **Time**: 2-5 hours/week
- **Effort**: Regular but sustainable
- **Tips**: Build into routine, consistency matters

### ⚡ Maintenance
- **What**: Keep momentum, prevent regression
- **Time**: 1-2 hours/week or 15-min touchdowns
- **Effort**: Minimal, just enough
- **Tips**: Even small effort helps psychologically

## Visualization Philosophy

### Why Not Lists?

Lists inherently show ranking:
- First item = most important
- Last item = least important
- Can feel guilt-inducing

### Why Radar Charts?

Radar charts:
- ✅ Show all resolutions equally (no ranking visual)
- ✅ Make progress visible (distance from center)
- ✅ Show relationships (connected polygon)
- ✅ Easy to see overall health at a glance
- ✅ Non-judgmental visualization

## Future Enhancements

### Short Term

1. **Explicit Progress Tracking**
   - Add progress update endpoint
   - Track actual % in database
   - Show progress update UI

2. **Complete/Delete Actions**
   - Implement buttons that call backend
   - Update resolutions via chat

3. **Better Tier Assignment**
   - Integrate with `prioritizeResolutions` tool
   - Show tier reasoning from Claude

### Medium Term

1. **Progress History**
   - Show progress over time (line chart)
   - Weekly summaries

2. **Prediction**
   - When will you complete each?
   - On track / falling behind indicator

3. **Dependency Visualization**
   - Show how resolutions relate
   - Connection lines in radar chart

4. **Goal Achievement Patterns**
   - What conditions lead to success?
   - Best times to focus on each

## Usage Guide

### Viewing Resolutions

1. **Collapsed**: See abbreviations of all active resolutions
2. **Expanded**: See radar chart overview of all
3. **Click resolution**: See detailed view

### Understanding the Display

**Radar Chart:**
- Center = 0% progress
- Edge = 100% progress
- Size/distance of each point shows progress
- Color shows tier

**Detail View:**
- Everything about that resolution
- Tier-specific guidance
- Timeline info
- Action buttons

### Interacting

- Click resolution initial → see details
- Click on radar chart → highlight resolution
- Click "Mark Complete" → finish resolution
- Click back arrow → return to overview

## Technical Details

### Type Definitions

```typescript
interface Resolution {
  id: string
  title: string
  measurable_criteria: string
  context?: string
  status: 'active' | 'completed'
  createdAt: string
  completedAt?: string
  updates: any[]
  progress?: number
}

interface ResolutionVisualizationData {
  name: string
  progress: number
  tier: 'immediate' | 'secondary' | 'maintenance'
  color: string
}
```

### Key Utilities

```typescript
calculateProgress(resolution)           // Estimate progress
categorizeTier(resolution, all, index) // Assign tier
getTierColor(tier)                     // Get color
getTierInfo(tier)                      // Get label & desc
resolutionToRadarData(resolutions)    // Transform for chart
calculateOverallHealth(resolutions)   // Summary stats
```

## Integration with Conversational Interface

**Conversational Interface (Left):**
- Create resolutions
- Prioritize resolutions
- Complete/delete via chat

**Structured Interface (Right):**
- View all at once
- Track progress
- See details
- Manage individually

**They work together:**
- Chat creates/manages → Structured shows overview
- Structured shows details → Use chat for changes
- Both update same data → Always in sync

---

**Design Principle:** Non-judgmental visualization of fluid, adaptive goals. No ranking, just different ways of looking at your growth.
