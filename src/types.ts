export interface Finding {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  suggestion?: string;
}

export interface AiMarketKeyword {
  keyword: string;
  volume: number;
  monthly: { month: string; volume: number }[];
}

export interface AiMarketData {
  keywords: AiMarketKeyword[];
  total_volume: number;
  top_keyword: string;
  top_volume: number;
  trend_direction: 'growing' | 'stable' | 'declining';
  trend_pct: number;
}

export interface AnalysisResult {
  url: string;
  score: number;
  categories: {
    structured_data: number;
    content_quality: number;
    entity_authority: number;
    technical_seo: number;
    ai_bonus: number;
  };
  findings: Finding[];
  suggestions?: { category: string; title: string; description: string; impact: string }[];
  ai_market_data?: AiMarketData | null;
}
