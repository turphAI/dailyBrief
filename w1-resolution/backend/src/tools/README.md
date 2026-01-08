# Resolution Tools

This folder contains all the tool functions used by Claude for managing resolutions. Each tool is responsible for a specific resolution operation.

## Structure

```
tools/
├── index.ts                 # Main exports
├── types.ts                 # Shared types and interfaces
├── createResolution.ts      # Create a new resolution
├── listResolutions.ts       # List resolutions by status
├── completeResolution.ts    # Mark resolution as completed
└── deleteResolution.ts      # Delete a resolution
```

## Tools Overview

### `createResolution(input, resolutions)`
Creates a new resolution with measurable criteria.

**Input:**
```javascript
{
  title: string,                  // e.g., "Exercise 3 times per week"
  measurable_criteria: string,    // e.g., "150+ sessions by year end"
  context?: string                // Optional context
}
```

**Constraints:**
- Maximum 5 active resolutions per user
- Title and measurable_criteria are required

**Returns:** Resolution object with ID, status, timestamps

---

### `listResolutions(input, resolutions)`
Retrieve resolutions filtered by status.

**Input:**
```javascript
{
  status: 'active' | 'completed' | 'all'
}
```

**Returns:** Array of resolutions matching the status filter

---

### `completeResolution(input, resolutions)`
Mark an existing resolution as completed.

**Input:**
```javascript
{
  id: string  // Resolution ID to complete
}
```

**Returns:** Updated resolution object with `completedAt` timestamp

---

### `deleteResolution(input, resolutions)`
Permanently delete a resolution.

**Input:**
```javascript
{
  id: string  // Resolution ID to delete
}
```

**Returns:** Deletion confirmation message

---

### `prioritizeResolutions(input, resolutions)`
Intelligently analyze and prioritize resolutions using reasoning about focus, time, and dependencies.

**Input:**
```javascript
{
  timePerWeek?: number,    // Hours available per week (default: 20)
  focusArea?: string,      // Current life focus (e.g., "health", "career")
  constraints?: string,    // Challenges affecting prioritization
  askFollowUp?: boolean    // Request clarifying questions
}
```

**Returns:** Strategy object with:
- **Immediate**: High-priority resolutions (5+ hours/week)
- **Secondary**: Medium-priority resolutions (2-5 hours/week)
- **Maintenance**: Low-effort resolutions (1-2 hours/week)
- **Dependencies**: How resolutions support each other
- **Strategy**: Narrative explanation of the approach
- **Questions**: Clarifying questions to refine strategy

**Key Features:**
- Analyzes resolution effort levels (daily, weekly, etc.)
- Detects dependencies between resolutions
- Allocates time intelligently based on focus area
- Generates questions for deeper reflection
- Emphasizes fluid prioritization (not waterfall)
- Balances progress across all resolutions

**Example Response:**
```
Tier System:
- Immediate Focus (2 resolutions): Peak energy here
- Secondary (2 resolutions): Steady progress
- Maintenance (1 resolution): 15-minute touch-ins

This is fluid. Shift tiers based on life changes, momentum, and dependencies.
```

---

## How They're Used

These tools are called by Claude during conversation through the Claude API's function calling mechanism. When a user asks Claude to create, list, complete, or delete resolutions, Claude will:

1. Determine which tool to use based on the user's request
2. Call the tool with appropriate parameters
3. Receive the result
4. Include the result in its response to the user

## Example

User: "Create a resolution to read 24 books this year"

Claude decides to call `createResolution` with:
```javascript
{
  title: "Read 24 books",
  measurable_criteria: "Complete 24 books by December 31, 2026",
  context: "Build consistent reading habits"
}
```

The tool creates the resolution and returns it, which Claude then presents to the user in a formatted response.

## Types

All tools use consistent return types defined in `types.ts`:

```typescript
interface ToolResult {
  success: boolean           // Whether operation succeeded
  message: string            // Human-readable message
  error?: string             // Error message if failed
  resolution?: any           // Single resolution (for create/complete)
  count?: number             // Count of resolutions (for list)
  resolutions?: any[]        // Array of resolutions (for list)
}
```
