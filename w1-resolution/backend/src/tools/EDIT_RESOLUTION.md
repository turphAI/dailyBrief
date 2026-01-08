# Edit Resolution Tool

## Overview
The `editResolution` tool allows Claude to update existing resolutions by modifying their title, measurable criteria, and context statement.

## Function Signature
```typescript
export function editResolution(input: any, resolutions: Map<string, any>): ToolResult
```

## Input Parameters
- `resolution_id` (required): The UUID of the resolution to edit
- `title` (optional): New title for the resolution
- `measurable_criteria` (optional): New measurable criteria/success metrics
- `context` (optional): New context statement explaining why the resolution matters

## Return Value
Returns a `ToolResult` object with:
- `success`: Boolean indicating if the edit was successful
- `message`: Human-readable summary of the changes made
- `resolution`: The updated resolution object (if successful)
- `error`: Error message (if unsuccessful)

## Example Usage

### Claude API Call
```json
{
  "name": "edit_resolution",
  "input": {
    "resolution_id": "c4a43bea-b8b0-4989-8fc1-ee2e229cfcc9",
    "title": "Run a 5K in under 25 minutes",
    "measurable_criteria": "Complete a 5K race with official time under 25 minutes within 12 months"
  }
}
```

### Claude Conversation
User: "Change my hiking goal to be about rock climbing instead"

Claude would:
1. Call `list_resolutions` to find the hiking resolution
2. Extract the resolution ID
3. Call `edit_resolution` with new title and criteria for rock climbing
4. Report the changes back to the user

## Behavior

### Validation
- Requires `resolution_id` - returns error if missing or resolution not found
- At least one of title, measurable_criteria, or context must be provided
- Trims whitespace from provided values
- Ignores empty strings or null values

### Change Tracking
- Records what was changed in the response message
- Adds `updatedAt` timestamp to the resolution
- Preserves all other resolution properties (status, createdAt, updates, etc.)

### Error Handling
- Returns error if resolution doesn't exist
- Returns error if no fields are provided to update
- Catches exceptions and returns with error message

## Integration with Claude
The tool is automatically available to Claude in conversations when editing resolutions. Claude will intelligently use it when the user requests changes to their existing resolutions.

## Example Workflow
1. User: "Update my 'Learn Spanish' resolution to include speaking practice"
2. Claude: Lists resolutions to find the Spanish one
3. Claude: Updates the resolution with new measurable criteria
4. Claude: Confirms the update with the user

## Related Tools
- `createResolution` - Create new resolutions
- `listResolutions` - View existing resolutions
- `deleteResolution` - Remove resolutions
- `completeResolution` - Mark resolutions as done
