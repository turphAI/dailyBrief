# Tools Quickstart Guide

## What You Now Have

A complete **resolution management tool suite** with intelligent prioritization:

```
5 Core Tools:
├── Create    → Add new resolutions
├── List      → View all resolutions
├── Complete  → Mark as done
├── Delete    → Remove resolutions
└── Prioritize → Smart strategy (NEW!)
```

## Try It Now

### Scenario 1: Just Starting
```
You: "I want to create a new resolution about reading more"

Claude will:
1. Ask clarifying questions
2. Help you define measurable criteria
3. Call createResolution()
4. Show you what was created
```

### Scenario 2: Feeling Overwhelmed
```
You: "I have too many resolutions and don't know what to focus on"

Claude will:
1. Call listResolutions({status: 'active'})
2. Call prioritizeResolutions({focusArea: 'your focus'})
3. Show you a tiered strategy
4. Explain dependencies
5. Suggest time allocation
```

### Scenario 3: Need Clarity
```
You: "Help me prioritize. I have 15 hours/week, and I'm focused on health"

Claude will:
1. Call prioritizeResolutions({
     timePerWeek: 15,
     focusArea: 'health',
     askFollowUp: true
   })
2. Generate clarifying questions
3. Provide detailed strategy
4. Show tier breakdown
```

## The Magic: Intelligent Prioritization

The `prioritizeResolutions` tool does this for you:

### Analyzes Your Resolutions
- Categorizes them (health, learning, career, etc.)
- Measures effort required (daily, weekly, occasional)
- Detects dependencies (exercise supports career focus)

### Creates Smart Tiers
```
Immediate Focus  (5+ hours/week) → Your priority targets
Secondary       (2-5 hours/week) → Steady progress
Maintenance     (<2 hours/week)  → Momentum preservation
```

### Generates Strategy
- Time allocation per resolution
- Why each tier matters
- How to handle dependencies
- When/how to shift tiers

### Asks Questions
When you request clarification:
- "How much does health impact your work energy?"
- "Are your learning goals career-related?"
- "What would feel like success?"
- "Any upcoming deadlines?"

## Key Concepts

### Fluid, Not Waterfall
This isn't "finish one, start another." It's **progress on all**, focused effort where it matters most.

```
❌ Waterfall (old way):
Resolution 1 → Resolution 2 → Resolution 3
(This causes guilt when you pause #1)

✅ Tiered (new way):
┌─ Immediate (6 hours)   ← Focus here
├─ Secondary (4 hours)   ← Steady progress
└─ Maintenance (2 hours) ← Keep momentum

You're progressing on everything, just at different speeds.
```

### Dependencies Matter
```
Health (Exercise)
  ↓ Gives you energy for ↓
Career & Learning
```

When your health resolution is "immediate focus," your career actually improves too. The tool understands this.

### Time Allocation Adapts
Based on:
- How much time you have
- What you're focusing on
- Effort required by each resolution
- Dependencies between them

## Example Workflow

**Week 1: Initial Setup**
```
You: "I have 5 resolutions: Exercise, Reading, Spanish, 
      Meditation, and a Project. Help me prioritize."

Claude prioritizes and shows strategy with tiers.
```

**Week 4: Progress Check**
```
You: "I've been crushing exercise! How can I use this momentum?"

Claude adjusts strategy to leverage your momentum.
```

**Week 8: Major Change**
```
You: "Work just got crazy. I have 10 hours/week, not 20."

Claude recalibrates strategy with new time constraint.
```

**Week 12: Shift Focus**
```
You: "I want to shift focus to learning. Help me adjust."

Claude reorganizes tiers, making Spanish immediate focus.
```

## The Full Tool Documentation

For deep dives, see:

- **README.md** - Complete tool reference
- **PRIORITIZATION_GUIDE.md** - How prioritization works
- **ARCHITECTURE.md** - How tools integrate
- **QUICKSTART.md** - This file!

## How to Use in Chat

### Start Simple
```
"Create a resolution to exercise 3 times per week"
"Show me my resolutions"
"I completed my reading goal!"
```

### Get Strategic
```
"Help me prioritize my resolutions"
"I have 15 hours/week. What should I focus on?"
"I'm tired. How can I adjust my strategy?"
```

### Ask Questions
```
"Ask me some questions about my resolutions"
"How are my resolutions connected?"
"What would be realistic for me?"
```

### Adapt
```
"Things have changed. Let me re-prioritize"
"I've made progress on X. How does that change things?"
"What should I focus on next?"
```

## What Makes This Different

Traditional productivity tools:
❌ Treat resolutions independently
❌ Push equal effort everywhere
❌ Become overwhelming with 3+ goals
❌ Don't adapt to life changes

This system:
✅ Understands dependencies
✅ Balances effort intelligently
✅ Handles multiple goals naturally
✅ Adapts fluidly to changes
✅ Feels supportive, not pushy

## Common Flows

### Flow 1: Create → Prioritize
```
You: "I want to add a new resolution: learn piano"
      → Claude creates it
      
You: "Now how do I fit this in?"
      → Claude re-prioritizes all 6 resolutions
```

### Flow 2: Progress → Adjust
```
You: "I completed my project! What's next?"
      → Claude removes it from priorities
      → Claude reorganizes tiers
      → Claude shows new opportunities
```

### Flow 3: Overwhelm → Strategy
```
You: "I feel overwhelmed"
      → Claude lists all resolutions
      → Claude creates tiered strategy
      → Claude explains dependencies
      → You feel supported
```

### Flow 4: Life Change → Adapt
```
You: "I just had a baby. What resolutions should I pause?"
      → Claude analyzes your resolutions
      → Claude suggests what can pause
      → Claude maintains core momentum
      → You feel realistic
```

## Success Metrics

You'll know it's working when:

✅ You're making progress on multiple resolutions
✅ You feel less guilt about not doing everything equally
✅ You understand why certain things are prioritized
✅ You can adapt quickly when life changes
✅ You celebrate wins without feeling like you're neglecting others
✅ You have a sustainable system, not a burnout machine

## Next Steps

1. **Try it:** Create a resolution or ask for prioritization
2. **Explore:** Ask clarifying questions
3. **Adapt:** Come back to re-prioritize as things change
4. **Celebrate:** Mark resolutions complete
5. **Repeat:** Monthly reviews with adjusted priorities

---

**Remember:** The goal isn't productivity theater or optimization porn. It's **sustainable progress on what matters to you**, with the wisdom to know you can't do everything at once.

You're building a life, not checking boxes. 🚀
