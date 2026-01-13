# Week 2: Model Mapping

## Mission
Create a comprehensive personal AI model guide - know which tools work best for what.

## Objective
Develop a map of AI models and their optimal use cases by testing different models with consistent prompts, documenting their strengths and weaknesses, and creating a personal reference guide for model selection.

## Requirements

### Models to Test (minimum 5)
- [ ] OpenAI GPT-4
- [ ] Claude (Anthropic)
- [ ] Gemini (Google)
- [ ] Llama
- [ ] (Additional model)

### Deliverables
1. **Test Results**: Document response time, accuracy, and style for each model
2. **Comparison Framework**: Use consistent prompts across all models
3. **Strengths & Weaknesses**: Detailed analysis per model
4. **Decision Tree**: Guide for when to use each model

## Project Structure
```
w2-resolution/
├── README.md (this file)
├── frontend/              # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx       # Main UI with prompt input and multi-model outputs
│   │   ├── types.ts      # TypeScript interfaces
│   │   └── ...
│   └── package.json
└── api/
    └── compare.ts        # OpenRouter API endpoint
```

## Setup Instructions

### 1. Get OpenRouter API Key
1. Sign up at [OpenRouter](https://openrouter.ai)
2. Create an API key (pay-as-you-go pricing, typically $0.01-0.50 per comparison)
3. Add to `.env.local` in the project root:
   ```bash
   OPENROUTER_API_KEY=your_key_here
   ```

### 2. Install Dependencies
```bash
cd w2-resolution/frontend
npm install
```

### 3. Run Development Server
From the project root:
```bash
npm run dev:w2
```

Or directly from w2-resolution/frontend:
```bash
npm run dev
```

The app will be available at http://localhost:5174

### 4. Run the API locally
For local API testing with Vercel CLI:
```bash
cd w2-resolution
vercel dev
```

## How It Works
1. Enter a prompt in the text area
2. Click "Compare Models" to test across all configured models
3. View side-by-side results with response times
4. Results are saved in history for future reference

## Default Models
- OpenAI GPT-4
- Claude 3.5 Sonnet
- Google Gemini Pro
- Meta Llama 3.2 90B Vision
- Mistral Large

## Resources
- OpenAI GPT-4, Claude, Gemini, Llama
- Comparison frameworks and benchmarks
- Prompt libraries for testing

## Notes
(Add your observations and insights here)
