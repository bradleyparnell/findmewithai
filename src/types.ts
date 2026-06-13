export interface Finding {
  id: string;
  label: string;
  status: 'pass' | 'fail' | 'warn';
  suggestion?: string;
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
}
