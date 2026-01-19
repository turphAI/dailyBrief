# Model Mapper - Experience Planning Brief

## Purpose
Create a cohesive app with two integrated experiences:
1. **Testing Lab** - Compare models with real prompts, capture metrics and observations
2. **Reference Guide** - Navigate a decision framework for choosing the right model

---

# EXPERIENCE 1: Testing Lab
*Input → Output → Metrics → Insights*

## What This Experience Does
The Testing Lab is where you actively test prompts across multiple models, compare responses, and capture structured observations. It's about building knowledge through experimentation.

### Core User Flow
1. **Input**: Enter or select a test prompt
2. **Execute**: Run prompt across all selected models in parallel
3. **Review**: See responses side-by-side with performance metrics
4. **Analyze**: Rate responses, add notes, tag with categories
5. **Capture**: Save structured insights that feed the Reference Guide

### Current Features (MVP)
- [x] Single prompt input
- [x] Multi-model parallel execution
- [x] Side-by-side response display
- [x] Response time tracking
- [x] Error handling per model
- [x] Basic history view

### Planned Enhancements

#### Input Stage
- [ ] **Prompt Library**: Pre-built test prompts organized by category
  - Coding (debug, explain, generate, review)
  - Creative (story, marketing, brainstorm)
  - Analysis (summarize, compare, reason)
  - Technical (math, facts, documentation)
- [ ] **Prompt Templates**: Fill-in-the-blank templates for consistent testing
- [ ] **Batch Testing**: Queue multiple prompts to run sequentially

#### Execution Stage
- [ ] **Model Selection**: Choose which models to include in comparison
- [ ] **Parameter Controls**: Adjust temperature, max_tokens per model
- [ ] **Progress Indicators**: Show which models are responding in real-time

#### Review Stage
- [ ] **Response Metrics**:
  - Response time (ms)
  - Token count (input/output)
  - Estimated cost
  - Character/word count
- [ ] **Response Actions**:
  - Copy response
  - Expand/collapse for detailed view
  - Diff view (highlight differences between models)

#### Analysis Stage
- [ ] **Rating System**:
  - Overall quality (1-5 stars)
  - Specific criteria (accuracy, clarity, creativity, etc.)
- [ ] **Tagging System**:
  - Pre-defined tags (fast, accurate, verbose, concise, creative)
  - Custom tags
- [ ] **Notes**: Add observations per model response
- [ ] **Winner Selection**: Mark which response(s) were best and why

#### Capture Stage
- [ ] **Structured Insights**:
  - Save comparison with all ratings/notes/tags
  - Automatically feed patterns into Reference Guide
  - Track model performance over time
- [ ] **Export Options**: Download comparison as JSON/CSV/Markdown

### Key Metrics to Track
- **Performance**: Response time, success rate
- **Cost**: Token usage, estimated dollars per request
- **Quality**: User ratings on multiple criteria
- **Patterns**: Which models excel at which categories

---

# EXPERIENCE 2: Reference Guide
*Navigate → Decide → Select*

## What This Experience Does
The Reference Guide synthesizes all your testing data into an actionable decision framework. Instead of searching through test history, you navigate a structured guide that answers "Which model should I use for X?"

### Core User Flow
1. **Navigate**: Browse by use case, criteria, or model
2. **Decide**: View recommendations based on accumulated test data
3. **Select**: Understand trade-offs and make informed model choice

### Navigation Approaches

#### By Use Case (Primary View)
```
📋 Use Cases
  ├─ 💻 Coding
  │   ├─ Debug Code → Recommendation: Claude 3.5 Sonnet
  │   ├─ Explain Code → Recommendation: GPT-4
  │   ├─ Generate Code → Recommendation: [Comparison data]
  │   └─ Review Code → Recommendation: [Comparison data]
  │
  ├─ ✍️ Creative Writing
  │   ├─ Storytelling → Recommendation: [Model + reasoning]
  │   ├─ Marketing Copy → Recommendation: [Model + reasoning]
  │   └─ Brainstorming → Recommendation: [Model + reasoning]
  │
  ├─ 📊 Analysis
  │   ├─ Summarization → Recommendation: [Model + reasoning]
  │   ├─ Data Interpretation → Recommendation: [Model + reasoning]
  │   └─ Logic Puzzles → Recommendation: [Model + reasoning]
  │
  └─ 💬 Conversation
      ├─ Factual Q&A → Recommendation: [Model + reasoning]
      └─ Explain Concepts → Recommendation: [Model + reasoning]
```

#### By Priority (Secondary View)
```
🎯 What Matters Most?
  ├─ Speed → Fastest models: [Ranked list with avg times]
  ├─ Cost → Cheapest models: [Ranked list with avg costs]
  ├─ Accuracy → Most accurate: [Ranked list with ratings]
  ├─ Creativity → Most creative: [Ranked list with ratings]
  └─ Balance → Best overall: [Balanced scorecard]
```

#### By Model (Tertiary View)
```
🤖 Model Profiles
  ├─ GPT-4
  │   ├─ Strengths: [Data-driven insights]
  │   ├─ Weaknesses: [Data-driven insights]
  │   ├─ Best For: [Top use cases]
  │   ├─ Avoid For: [Bottom use cases]
  │   └─ Stats: [Avg time, cost, ratings]
  │
  ├─ Claude 3.5 Sonnet
  │   └─ [Same structure]
  ...
```

### Content Structure

#### Recommendation Card
For each use case, show:
- **Primary Recommendation**: Top model with confidence score
- **Why**: Key reasons based on test data
- **Stats**: Avg response time, cost, quality rating
- **Trade-offs**: "Faster but less detailed" or "More expensive but more accurate"
- **Alternatives**: 2nd and 3rd place options with differentiators
- **Sample Output**: Example response from this model for this use case

#### Decision Matrix
Interactive table view:
```
                Speed   Cost   Accuracy   Creativity   Overall
GPT-4           ⭐⭐⭐   ⭐⭐     ⭐⭐⭐⭐⭐     ⭐⭐⭐⭐       A+
Claude 3.5      ⭐⭐⭐⭐  ⭐⭐⭐   ⭐⭐⭐⭐⭐     ⭐⭐⭐⭐       A+
Gemini Pro      ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐  ⭐⭐⭐⭐      ⭐⭐⭐        A
Llama 3.2       ⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ ⭐⭐⭐       ⭐⭐⭐        B+
Mistral         ⭐⭐⭐⭐  ⭐⭐⭐⭐  ⭐⭐⭐⭐      ⭐⭐⭐        A-
```

### Features to Build

#### Data Visualization
- [ ] **Performance Charts**: Response time distribution per model
- [ ] **Cost Analysis**: Cost per category/model over time
- [ ] **Quality Trends**: Rating trends as you test more
- [ ] **Category Heatmap**: Which models excel in which categories

#### Interactive Guide
- [ ] **Search**: "Best model for debugging Python"
- [ ] **Filters**: Filter by speed/cost/quality thresholds
- [ ] **Comparison Mode**: Compare 2-3 models side-by-side
- [ ] **Quick Links**: Jump from guide to testing lab with pre-filled prompt

#### Intelligence Layer
- [ ] **Confidence Scores**: How much test data supports each recommendation
- [ ] **Data Gaps**: "You haven't tested X yet"
- [ ] **Suggestions**: "Try testing model Y for use case Z"
- [ ] **Updates**: "Your latest tests changed the recommendation for X"

---

# Integration Between Experiences

## How They Connect

### Testing Lab → Reference Guide
- Every rated/tagged comparison updates the Reference Guide data
- Insights automatically populate recommendations
- Patterns emerge as you test more prompts

### Reference Guide → Testing Lab
- "Test this recommendation" button
- "Not enough data" → Quick link to run suggested tests
- Gap analysis highlights what to test next

## Unified Data Model
```
Test Result
├─ Prompt (text, category, tags)
├─ Model Responses[]
│   ├─ Model name
│   ├─ Response text
│   ├─ Metrics (time, tokens, cost)
│   ├─ Ratings (overall, accuracy, creativity, etc)
│   ├─ Tags (fast, verbose, creative, etc)
│   └─ Notes
└─ Winner (which model, why)

Reference Data (Aggregated)
├─ By Use Case
│   └─ Recommendation (model, confidence, reasoning, stats)
├─ By Model
│   └─ Profile (strengths, weaknesses, best-for, stats)
└─ Overall Insights
    └─ Patterns, trends, gaps
```

---

# Open Design Questions

1. **Initial State**: What does Reference Guide show before any testing?
2. **Minimum Data**: How many tests needed before showing recommendations?
3. **Persistence**: Local storage, database, or export/import?
4. **Sharing**: Can users share their Reference Guide with others?
5. **Navigation**: Tabs, sidebar, or page routing between experiences?
6. **Mobile**: Optimize for mobile or desktop-first?

---

## Next Steps
- [ ] Review and refine two-experience structure
- [ ] Decide on navigation approach between experiences
- [ ] Design data model for test results and aggregated insights
- [ ] Sketch wireframes for both experiences
- [ ] Prioritize MVP features for each experience
- [ ] Plan implementation phases

---

## Notes & Insights
(Use this space to capture thoughts as you plan)
