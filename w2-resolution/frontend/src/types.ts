export interface ModelRatings {
  accuracy?: number; // 1-5
  style?: number; // 1-5
  speed?: number; // 1-5
  xFactor?: number; // 1-5
}

export interface ModelResponse {
  model: string;
  response: string;
  responseTime: number;
  error?: string;
  ratings?: ModelRatings;
  notes?: string;
}

export interface ComparisonRequest {
  prompt: string;
  models: string[];
}

export interface ComparisonResult {
  id: string;
  prompt: string;
  promptTitle?: string;
  promptType?: string; // 'coding', 'creative', 'analysis', 'conversation', 'technical'
  timestamp: string;
  results: ModelResponse[];
  expanded?: boolean;
}
