export interface ModelResponse {
  model: string;
  response: string;
  responseTime: number;
  error?: string;
}

export interface ComparisonRequest {
  prompt: string;
  models: string[];
}

export interface ComparisonResult {
  prompt: string;
  timestamp: string;
  results: ModelResponse[];
}
