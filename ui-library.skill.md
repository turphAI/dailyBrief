# UI Library Standard

## Critical Requirement: shadcn/ui Only

**ALWAYS use shadcn/ui components for ALL UI development in this project.**

### Rules
1. **Never** use raw HTML elements for interactive UI (buttons, inputs, selects, etc.)
2. **Always** use shadcn/ui components from `src/components/ui/`
3. **Never** create custom styled components - use shadcn variants instead
4. **Always** check if a shadcn component exists before building custom UI

### Setting Up shadcn/ui

When working in a new workspace (w1, w2, w3, etc.):

1. Initialize shadcn:
   ```bash
   cd frontend
   npx shadcn@latest init
   ```

2. Add components as needed:
   ```bash
   npx shadcn@latest add button
   npx shadcn@latest add input
   npx shadcn@latest add textarea
   npx shadcn@latest add select
   npx shadcn@latest add card
   npx shadcn@latest add badge
   npx shadcn@latest add separator
   npx shadcn@latest add scroll-area
   npx shadcn@latest add sheet
   npx shadcn@latest add dialog
   ```

### Common Component Mappings

Replace raw elements with shadcn components:

| ❌ Don't Use | ✅ Use Instead |
|-------------|---------------|
| `<button>` | `<Button>` from `@/components/ui/button` |
| `<input>` | `<Input>` from `@/components/ui/input` |
| `<textarea>` | `<Textarea>` from `@/components/ui/textarea` |
| `<select>` | `<Select>` from `@/components/ui/select` |
| `<div className="card">` | `<Card>` from `@/components/ui/card` |
| `<span className="badge">` | `<Badge>` from `@/components/ui/badge` |

### Example: Before and After

❌ **Before (Raw HTML):**
```tsx
<button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
  Click me
</button>
```

✅ **After (shadcn):**
```tsx
import { Button } from "@/components/ui/button"

<Button>Click me</Button>
```

### Variants

Use shadcn's built-in variants instead of custom classes:

```tsx
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon</Button>
```

### When to Remind

If you see ANY of these patterns in the code, stop and convert to shadcn first:
- `<button className=`
- `<input className=`
- `<textarea className=`
- `<select className=`
- Custom styled divs that look like cards, badges, or other UI components

### Resources

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
