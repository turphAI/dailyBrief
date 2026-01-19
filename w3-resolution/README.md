# Week 3: Deep Research

## Mission
Master the art of AI-assisted deep research on any topic.

## Objective
Pick a topic you're curious about and conduct thorough research using AI tools. Learn to verify sources, cross-reference information, and synthesize findings into a comprehensive report or presentation.

## Requirements

### Core Capabilities
- [ ] Topic selection and research planning
- [ ] AI-powered research queries using Claude
- [ ] Source verification and cross-referencing
- [ ] Information synthesis and organization
- [ ] Comprehensive report generation

### Tips & Tactics
1. Choose a topic with multiple perspectives
2. Use AI to find primary sources
3. Cross-reference AI outputs with authoritative sources
4. Create a structured research methodology

## Project Structure
```
w3-resolution/
├── README.md (this file)
├── frontend/              # React + TypeScript app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── views/        # Main views
│   │   └── ...
│   └── package.json
└── api/
    └── research.ts       # Claude API integration for research
```

## Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **API**: Vercel Serverless Functions
- **AI**: Claude API (Anthropic)

## Features (Planned)

### Research Workflow
- Topic brainstorming and refinement
- Research question formulation
- Multi-query research sessions
- Source tracking and citation management
- Note-taking and annotation
- Report/presentation builder

### Research Tools
- Deep dive on specific topics
- Compare and contrast different perspectives
- Timeline creation for historical topics
- Concept mapping
- Bibliography generation

## Getting Started

### Setup Instructions
1. Install dependencies:
   ```bash
   cd w3-resolution/frontend
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

### Environment Variables
Required in `.env.local` at project root:
```bash
ANTHROPIC_API_KEY=your_key_here
```

## Resources
- Claude API for research queries
- Academic paper search integrations
- Source verification tools

## TODO
- [ ] Export research findings to Figma presentation format (instead of markdown)
  - Design presentation template in Figma
  - Build export functionality to generate Figma-compatible JSON
  - Include research questions, responses, and resources in presentation slides

## Notes
(Add your research observations and methodology here)
