# Tools Architecture

## Folder Structure

```
backend/src/tools/
├── README.md                      # Complete tools documentation
├── PRIORITIZATION_GUIDE.md        # Deep dive into prioritization
├── ARCHITECTURE.md                # This file
├── index.ts                       # Central exports
├── types.ts                       # Shared TypeScript interfaces
├── createResolution.ts            # Create new resolutions
├── listResolutions.ts             # Query resolutions by status
├── completeResolution.ts          # Mark resolutions as done
├── deleteResolution.ts            # Remove resolutions
└── prioritizeResolutions.ts       # Intelligent prioritization
```

## Tool Flow

```
Claude (Chat Interface)
  │
  ├─→ Receives user message
  │
  ├─→ Decides which tool(s) to call based on content
  │
  ├─→ Calls tool via Claude API function calling
  │
  ├─→ Tool executes and returns result
  │
  └─→ Claude incorporates result into response
         and sends to user
```

## Five Resolution Tools

### 1. **createResolution**
```
Input: {title, measurable_criteria, context}
Output: Resolution object with ID, status, timestamps
Used for: Creating new resolutions
Validation: Title & criteria required, max 5 active
```

### 2. **listResolutions**
```
Input: {status: 'active' | 'completed' | 'all'}
Output: Filtered array of resolutions
Used for: Checking status, counting active resolutions
Validation: None - safe to call anytime
```

### 3. **completeResolution**
```
Input: {id}
Output: Updated resolution with completedAt timestamp
Used for: Marking achievements
Validation: Resolution must exist
```

### 4. **deleteResolution**
```
Input: {id}
Output: Confirmation message
Used for: Removing no-longer-relevant resolutions
Validation: Resolution must exist
```

### 5. **prioritizeResolutions**
```
Input: {timePerWeek?, focusArea?, constraints?, askFollowUp?}
Output: Strategy object with tiers, dependencies, reasoning
Used for: Creating balanced, adaptive strategies
Validation: Must have active resolutions
```

## Data Flow

```
┌─────────────────────────────────┐
│   User Message (Chat)           │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   Claude receives message       │
│   - Analyzes user intent        │
│   - Decides if tool needed      │
└────────────┬────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
   Tool Call    Direct Response
   Required     (No tool needed)
      │             │
      ▼             ▼
┌──────────────────────────────────┐
│  Tool Implementation Executes    │
│  - Validates input              │
│  - Performs operation           │
│  - Returns ToolResult           │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  Claude Processes Result         │
│  - Formats response             │
│  - Adds context/explanation     │
│  - Provides next steps          │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│  User sees formatted response    │
└──────────────────────────────────┘
```

## Tool Definitions for Claude API

Each tool must be defined with:

```typescript
{
  name: string              // Tool identifier (snake_case)
  description: string       // What the tool does
  input_schema: {
    type: 'object'
    properties: {...}       // Input field definitions
    required: [...]         // Required fields
  }
}
```

This allows Claude to understand:
- When to use each tool
- What inputs are needed
- Which inputs are optional

## Example: Complete User Journey

```
User: "I have too much to do. Help me figure out what to focus on."

Claude's thinking:
1. User has multiple resolutions
2. Wants help prioritizing
3. Should call prioritizeResolutions tool
4. But first, might need to list what they have

Claude's action:
→ Calls listResolutions({status: 'active'})
← Gets back: Exercise, Reading, Spanish, Meditation

Claude continues:
→ Calls prioritizeResolutions({
    focusArea: "balanced",
    askFollowUp: true
  })
← Gets back: Strategy with tiers, dependencies, questions

Claude's response to user:
"I found 4 active resolutions. Here's my strategy:

Immediate Focus (6 hours/week):
- Exercise - foundation of your health
- Meditation - supports everything

Secondary (4 hours/week):
- Reading, Spanish - steady learning

I have some questions to refine this:
- How much does exercise energy impact...
"
```

## Type Safety

All tools use consistent types from `types.ts`:

```typescript
// What each tool returns
interface ToolResult {
  success: boolean
  message: string
  error?: string
  resolution?: any        // Single resolution
  count?: number          // Count
  resolutions?: any[]     // Multiple resolutions
}
```

This ensures:
- Predictable return values
- Easy error handling
- Clear Claude integration
- Type-safe implementations

## Adding New Tools

To add a new tool:

1. **Create new file:** `backend/src/tools/newTool.ts`
```typescript
import { ToolResult } from './types'

export function newTool(input: any, resolutions: Map<string, any>): ToolResult {
  // Implementation
}
```

2. **Export from index:**
```typescript
export { newTool } from './newTool'
```

3. **Add to chat service:**
```typescript
import { newTool } from '../tools/index'

const TOOLS = [
  // ... existing tools
  {
    name: 'new_tool',
    description: '...',
    input_schema: { ... }
  }
]

const toolImplementations = {
  // ... existing
  new_tool: newTool
}
```

4. **Update README** with documentation

## Current Capabilities

With these 5 tools, Claude can:

✅ Create resolutions
✅ List and review progress
✅ Mark resolutions complete
✅ Remove resolutions
✅ Intelligently prioritize all of them
✅ Suggest dependencies between goals
✅ Allocate time effectively
✅ Ask clarifying questions
✅ Adapt strategy based on constraints

## Future Tools

Potential additions:

- **measureProgress()** - Track progress over time
- **suggestCheckIn()** - Recommend resolution reviews
- **detectPatterns()** - Find patterns in completion
- **suggestRelated()** - Suggest complementary resolutions
- **estimateTimeline()** - Project completion dates
- **generateMotivation()** - Provide encouragement based on progress

---

**The key insight:** Tools are how Claude takes action in your system. Each tool is a self-contained piece of business logic that Claude calls when appropriate. Keep them focused and well-documented.
