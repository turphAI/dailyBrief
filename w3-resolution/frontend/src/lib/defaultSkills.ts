import type { ResearchSkill } from '../types'

/**
 * Default research skills that every new topic starts with
 */
export const DEFAULT_SKILLS: ResearchSkill[] = [
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    description: 'Research a concept, technology, or topic in comprehensive depth',
    icon: '🔍',
    systemPrompt: `You are an expert researcher conducting deep, comprehensive research. Your task is to provide an in-depth analysis of the given concept within the context of the research topic.

Your response should:
- Provide comprehensive coverage of the concept
- Include technical details, examples, and real-world applications
- Explain key principles and mechanisms
- Discuss benefits, limitations, and trade-offs
- Reference specific technologies, companies, or implementations
- Use clear markdown formatting with headers, lists, and code blocks

Write in an educational, authoritative tone suitable for a technical research document.`,
    userPromptTemplate: `Research the following concept in depth within the context of "{topic}":

**Concept:** {concept}

Provide a comprehensive analysis including:
1. Core definition and principles
2. How it works (technical details)
3. Real-world applications and examples
4. Benefits and advantages
5. Limitations and challenges
6. Related technologies or approaches

Format the response as a complete markdown section ready to be inserted into a research document.`,
    parameters: [
      {
        name: 'concept',
        type: 'text',
        required: true,
        placeholder: 'e.g., Vector Databases, Retrieval Augmented Generation',
        description: 'The concept or topic to research in depth'
      }
    ],
    targetStrategy: 'new-section',
    enabled: true,
    createdAt: new Date().toISOString(),
    isBuiltIn: true
  },
  {
    id: 'compare-contrast',
    name: 'Compare & Contrast',
    description: 'Compare two approaches, technologies, or concepts side-by-side',
    icon: '📊',
    systemPrompt: `You are an expert analyst conducting comparative research. Your task is to provide a balanced, detailed comparison of two concepts, technologies, or approaches.

Your comparison should:
- Clearly explain each option
- Compare across multiple dimensions (performance, complexity, cost, use cases, etc.)
- Include pros and cons for each
- Provide specific examples or case studies
- Recommend when to use each option
- Use tables or structured comparisons where helpful

Write objectively and provide actionable insights for decision-making.`,
    userPromptTemplate: `Compare and contrast the following two concepts within the context of "{topic}":

**Option A:** {optionA}
**Option B:** {optionB}

Provide a comprehensive comparison including:
1. Overview of each option
2. Key differences and similarities
3. Comparison table across important dimensions
4. Pros and cons of each
5. Use case recommendations
6. Real-world examples or implementations

Format as a complete markdown section with tables and clear structure.`,
    parameters: [
      {
        name: 'optionA',
        type: 'text',
        required: true,
        placeholder: 'e.g., PostgreSQL with pgvector',
        description: 'First option to compare'
      },
      {
        name: 'optionB',
        type: 'text',
        required: true,
        placeholder: 'e.g., Pinecone',
        description: 'Second option to compare'
      }
    ],
    targetStrategy: 'new-section',
    enabled: true,
    createdAt: new Date().toISOString(),
    isBuiltIn: true
  },
  {
    id: 'add-examples',
    name: 'Add Examples',
    description: 'Generate concrete, real-world examples for a concept',
    icon: '💡',
    systemPrompt: `You are an expert technical writer skilled at creating clear, practical examples. Your task is to provide concrete, real-world examples that illustrate concepts effectively.

Your examples should:
- Be specific and actionable
- Include code snippets where relevant
- Reference actual companies, products, or implementations
- Explain why each example is relevant
- Cover different use cases or scenarios
- Use proper markdown formatting with code blocks

Make examples practical and relatable.`,
    userPromptTemplate: `Provide 3-5 concrete, real-world examples for the following concept in the context of "{topic}":

**Concept:** {concept}

For each example:
- Describe the scenario or use case
- Include code snippets or implementation details (if applicable)
- Explain why this example is relevant or interesting
- Reference actual companies or products when possible

Format as markdown with proper code blocks and structure.`,
    parameters: [
      {
        name: 'concept',
        type: 'textarea',
        required: true,
        placeholder: 'Paste the concept or section you want examples for',
        description: 'The concept or section to add examples for'
      }
    ],
    targetStrategy: 'append-to-section',
    enabled: true,
    createdAt: new Date().toISOString(),
    isBuiltIn: true
  },
  {
    id: 'architecture-analysis',
    name: 'Architecture Analysis',
    description: 'Analyze and document system architecture and design patterns',
    icon: '🏗️',
    systemPrompt: `You are a software architect and systems analyst. Your task is to analyze and document the architecture of systems, frameworks, or technical approaches.

Your analysis should:
- Describe the high-level architecture and components
- Explain how components interact
- Identify key design patterns and principles
- Discuss scalability, reliability, and performance considerations
- Include architecture diagrams (in text/ASCII or mermaid format)
- Reference specific implementation details

Write with technical depth suitable for engineers and architects.`,
    userPromptTemplate: `Analyze the architecture of the following system within the context of "{topic}":

**System:** {system}

Provide a comprehensive architectural analysis including:
1. High-level architecture overview
2. Core components and their responsibilities
3. Data flow and component interactions
4. Key design patterns used
5. Architecture diagram (ASCII art or mermaid)
6. Scalability and performance considerations
7. Trade-offs and design decisions

Format as a detailed markdown section with diagrams.`,
    parameters: [
      {
        name: 'system',
        type: 'text',
        required: true,
        placeholder: 'e.g., LangChain RAG pipeline, Vercel Edge Runtime',
        description: 'The system or architecture to analyze'
      }
    ],
    targetStrategy: 'new-section',
    enabled: true,
    createdAt: new Date().toISOString(),
    isBuiltIn: true
  },
  {
    id: 'find-resources',
    name: 'Find Resources',
    description: 'Discover and curate authoritative resources on a topic',
    icon: '🔗',
    systemPrompt: `You are a research librarian and technical curator. Your task is to identify and organize authoritative resources on technical topics.

Your resource list should:
- Include official documentation, papers, articles, and repositories
- Prioritize authoritative and up-to-date sources
- Categorize resources by type (docs, tutorials, papers, tools, etc.)
- Provide brief descriptions of what each resource offers
- Note what makes each resource valuable
- Use proper citations and links (when known)

Focus on quality over quantity.`,
    userPromptTemplate: `Find and curate authoritative resources on the following topic within the context of "{topic}":

**Topic:** {resourceTopic}

Provide a categorized list of resources including:
- Official documentation
- Foundational papers or articles
- Tutorials and guides
- Open source projects and tools
- Community resources

For each resource:
- Include title and description
- Note what makes it valuable
- Categorize by type

Format as an organized markdown section with proper links (use placeholder URLs).`,
    parameters: [
      {
        name: 'resourceTopic',
        type: 'text',
        required: true,
        placeholder: 'e.g., Embedding models, Vector search algorithms',
        description: 'Topic to find resources for'
      }
    ],
    targetStrategy: 'new-section',
    enabled: true,
    createdAt: new Date().toISOString(),
    isBuiltIn: true
  },
  {
    id: 'organize-document',
    name: 'Organize & Consolidate',
    description: 'Reorganize the entire document with proper structure, remove redundancy, and improve flow',
    icon: '📝',
    systemPrompt: `You are an expert technical editor and document architect. Your task is to take an existing research document and reorganize it into a coherent, well-structured document.

Your reorganization should:
- Create a logical information architecture (Executive Summary → Core Concepts → Details → Advanced Topics → Resources)
- Group related content into thematic sections
- Remove redundancy and consolidate overlapping information
- Ensure smooth transitions between sections
- Add an Executive Summary if missing
- Use clear hierarchical structure (##, ###, ####)
- Maintain all important content (don't remove valuable information)
- Improve readability and flow

CRITICAL: Return the ENTIRE reorganized document, not just changes. The output will replace the current document.`,
    userPromptTemplate: `Reorganize and consolidate the following research document on "{topic}":

{currentDocument}

---

Tasks:
1. Analyze the content and identify main themes
2. Create a logical structure with clear sections
3. Remove redundancy where content overlaps
4. Consolidate similar concepts into coherent sections
5. Add an Executive Summary at the top if missing
6. Ensure proper markdown hierarchy (##, ###, ####)
7. Improve transitions and flow between sections
8. Preserve all valuable information and examples

Return the COMPLETE reorganized document in markdown format. This will replace the current document entirely.`,
    parameters: [],
    targetStrategy: 'replace-selection',
    enabled: true,
    createdAt: new Date().toISOString(),
    isBuiltIn: true
  }
]

/**
 * Get default skills for a new research topic
 */
export function getDefaultSkills(): ResearchSkill[] {
  return DEFAULT_SKILLS.map(skill => ({
    ...skill,
    createdAt: new Date().toISOString()
  }))
}
