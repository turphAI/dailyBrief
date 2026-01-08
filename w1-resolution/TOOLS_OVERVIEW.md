# Daily Brief: Tools Overview

## What is a Tool?

Tools are actions Claude can take within your resolution system. When you chat with Claude, it can:
- Create new resolutions
- List your current resolutions
- Mark resolutions complete
- Delete resolutions
- Intelligently prioritize all of them

## Your Tools

### 1️⃣ **Create Resolution**
Create a new resolution with measurable criteria.

```
You: "I want to start exercising more"

Claude will:
- Ask clarifying questions
- Help define measurable criteria
- Create the resolution
- Show you what was created
```

**Limits:** Maximum 5 active resolutions

---

### 2️⃣ **List Resolutions**
View all your resolutions filtered by status.

```
You: "Show me my active resolutions"

Claude returns:
- All active resolutions
- Count of each status
- Details about each one
```

---

### 3️⃣ **Complete Resolution**
Mark a resolution as successfully completed.

```
You: "I finished reading 24 books!"

Claude will:
- Mark it complete
- Show the timestamp
- Celebrate with you
- Ask what's next
```

---

### 4️⃣ **Delete Resolution**
Remove a resolution permanently.

```
You: "I want to drop the piano learning goal"

Claude will:
- Confirm deletion
- Remove it
- Help you refocus on remaining resolutions
```

---

### 5️⃣ **Prioritize Resolutions** ⭐ NEW!
Intelligently analyze and prioritize all resolutions.

```
You: "I'm overwhelmed. Help me prioritize."

Claude will:
- Analyze your resolutions
- Create a tiered strategy
- Show time allocation
- Explain dependencies
- Answer clarifying questions
- Provide narrative guidance
```

**This is the game-changer.** It uses reasoning to create a **fluid, adaptive strategy** instead of treating all resolutions equally.

---

## The Prioritization Strategy Explained

### Three Tiers

```
┌─────────────────────────────────────┐
│ IMMEDIATE FOCUS (5+ hours/week)     │
│ Your priority targets               │
│ Examples: Exercise (during health   │
│ focus), Learning new career skill   │
└─────────────────────────────────────┘
         ▼ Gets your peak energy
         
┌─────────────────────────────────────┐
│ SECONDARY (2-5 hours/week)          │
│ Important, steady progress          │
│ Examples: Reading, hobby learning   │
└─────────────────────────────────────┘
         ▼ Regular attention
         
┌─────────────────────────────────────┐
│ MAINTENANCE (<2 hours/week)         │
│ Keep momentum, prevent regression   │
│ Examples: 15 min meditation,        │
│ social connection touchpoint        │
└─────────────────────────────────────┘
         ▼ Just enough to stay engaged
```

### Key Principles

**1. Fluid, Not Waterfall**
```
❌ Do Resolution 1, then 2, then 3
✅ Make progress on all, focused where it matters
```

**2. Dependencies Matter**
```
Health (Exercise) → Gives energy for → Career & Learning
Mindfulness → Supports → Everything
```

**3. Adapts to Life**
```
Week 1: "I have 20 hours/week"
Week 5: "I only have 10 hours" → Strategy adjusts
Week 9: "Health going great!" → Momentum shifts tiers
```

---

## How It Works

### Example Scenario

**Your Resolutions:**
1. Exercise 3x/week
2. Read 24 books
3. Learn Spanish
4. Meditate daily

**Available Time:** 20 hours/week
**Your Focus:** Health & wellness

### What Prioritizeresolutions Returns

```
IMMEDIATE FOCUS (8 hours/week)
├─ Exercise (5 hours)
│  └─ Reason: Daily commitment, foundation of health focus
└─ Meditation (3 hours)
   └─ Reason: Supports focus and mental clarity

SECONDARY (5 hours/week)
├─ Reading (3 hours)
│  └─ Reason: Pairs well with meditation practice
└─ Spanish (2 hours)
   └─ Reason: Mental stimulation, flexible schedule

DEPENDENCIES
└─ Exercise → Gives energy for → Spanish learning

STRATEGY NARRATIVE
"Build a strong foundation with exercise and meditation.
These foundational practices will actually boost your
learning and reading. Spanish benefits from the mental
clarity that comes from meditation and fitness."

CLARIFYING QUESTIONS
- "How much do you expect exercise to improve your focus?"
- "Is Spanish tied to a career goal or personal interest?"
- "What would success look like for you in Q1?"
```

---

## Tool Structure

```
backend/src/tools/
├── README.md                      ← Complete reference
├── QUICKSTART.md                  ← Quick guide (start here!)
├── PRIORITIZATION_GUIDE.md        ← Deep dive on prioritization
├── ARCHITECTURE.md                ← How it all connects
│
├── index.ts                       ← Exports all tools
├── types.ts                       ← Shared TypeScript types
│
├── createResolution.ts            ← Tool implementation
├── listResolutions.ts
├── completeResolution.ts
├── deleteResolution.ts
└── prioritizeResolutions.ts       ← NEW! The smart one
```

---

## Real-World Examples

### Example 1: Initial Setup
```
You: "I want to track 4 resolutions: exercise, reading, 
      meditation, and a side project. Help me get started."

Claude:
1. Creates all 4 resolutions (validates measurable criteria)
2. Calls prioritizeResolutions
3. Shows you a tiered strategy
4. Answers any questions
```

### Example 2: Life Gets Busy
```
You: "Work has gotten insane. I can only do 10 hours/week now."

Claude:
1. Calls listResolutions to see what you have
2. Calls prioritizeResolutions with new time constraint
3. Shows adjusted strategy
4. Maybe suggests temporarily moving something to maintenance
5. Emphasizes: "You're not failing, you're adapting"
```

### Example 3: Progress Momentum
```
You: "I've been crushing my exercise goal! 
      How can I use this momentum?"

Claude:
1. Acknowledges the win
2. Re-prioritizes to leverage momentum
3. Maybe moves something from secondary to immediate
4. Explains the new strategy
5. Keeps you motivated
```

### Example 4: Completion
```
You: "I finished reading 24 books this year!"

Claude:
1. Marks the resolution complete (celebratory!)
2. Lists remaining active resolutions
3. Offers to help you set new goals
4. Or shows updated prioritization without this one
```

---

## The Game-Changer: Why Prioritization Matters

Without prioritization:
- ❌ You feel guilty about not giving equal effort to everything
- ❌ You don't understand why things should be different priority
- ❌ You can't adapt when life changes
- ❌ You don't see how goals support each other

With the tool:
- ✅ You understand the strategy
- ✅ You focus where it matters most
- ✅ You feel okay with unequal effort
- ✅ You can quickly adjust to life changes
- ✅ You see the big picture (dependencies, time, effort)
- ✅ You have a sustainable system

---

## How to Get Started

### In Your Chat with Claude

**Option 1: Simple**
```
"Help me prioritize my resolutions"
```

**Option 2: With Context**
```
"Help me prioritize. I have 20 hours/week available 
and I'm focused on health and learning right now."
```

**Option 3: With Clarification**
```
"Help me prioritize. I have 20 hours/week, focused on health.
Ask me some questions so you understand my situation better."
```

### What Happens Next

Claude will:
1. Review your active resolutions
2. Analyze them for effort, type, and dependencies
3. Create a tiered strategy based on your time and focus
4. Explain the reasoning
5. Ask clarifying questions (if requested)
6. Help you understand how to adjust over time

---

## Documentation Files

In `backend/src/tools/`:

- **README.md** - Complete tool reference (what each tool does)
- **QUICKSTART.md** - Quick start guide (try this first!)
- **PRIORITIZATION_GUIDE.md** - Deep dive into prioritization philosophy
- **ARCHITECTURE.md** - Technical architecture and tool integration

---

## Key Takeaway

You now have a **complete system** for:

✅ Creating resolutions with Claude's help
✅ Managing your resolution list
✅ Tracking progress
✅ **Intelligently prioritizing** with reasoning about focus, time, and dependencies
✅ Adapting as life changes
✅ Maintaining sustainable progress across multiple goals

The prioritization tool is the big upgrade: it thinks through your resolutions holistically and creates a fluid, adaptive strategy instead of a rigid plan.

**Start with:**
1. Create your resolutions
2. Ask for prioritization
3. Have Claude explain the strategy
4. Adjust as life happens
5. Re-prioritize monthly

You've got this! 🚀
