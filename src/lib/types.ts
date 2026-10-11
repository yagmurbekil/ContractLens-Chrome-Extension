import { LLMFinding, DocumentType, RiskLevel, FindingCategory, FindingSeverity } from './schema';

export interface VerifiedFinding extends LLMFinding {
  verified: boolean;
  verificationStatus: 'verified_exact' | 'verified_normalized' | 'unverified_not_found' | 'unverified_too_short' | 'unverified_ambiguous';
  verificationDetails: string;
  matchedText?: string;
  matchedOffsets?: {
    start: number;
    end: number;
  };
}

export type AnalysisStatus = 'valid' | 'insufficient_data' | 'uncertain_analysis' | 'security_alert';

export interface CategoryScoreDetail {
  category: FindingCategory;
  findingCount: number;
  highestSeverity: FindingSeverity;
  subtotalScore: number;
}

export interface ScoreBreakdown {
  baseScore: number;
  categoryDeduplicatedScore: number;
  finalScore: number;
  riskLevel: RiskLevel;
  totalFindingsEvaluated: number;
  verifiedFindingsCount: number;
  rejectedFindingsCount: number;
  categoryDetails: CategoryScoreDetail[];
  insufficientDataReason?: string;
}

export interface AnalysisReport {
  documentType: DocumentType;
  status: AnalysisStatus;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  summaryTr: string;
  verifiedFindings: VerifiedFinding[];
  rejectedFindings: VerifiedFinding[];
  scoreBreakdown: ScoreBreakdown;
  limitationsTr: string[];
  needsHumanReview: boolean;
  promptInjectionDetected: boolean;
  promptInjectionWarnings: string[];
  documentMetadata: {
    url: string;
    domain: string;
    title: string;
    wordCount: number;
    charCount: number;
    analyzedAt: string;
    extractionMethod: 'page_agent_hybrid' | 'deterministic_dom';
  };
}

export interface ExtractedChunk {
  id: string;
  index: number;
  sectionHeading: string;
  text: string;
  startOffset: number;
  endOffset: number;
  charCount: number;
}

export interface ExtractedDocument {
  url: string;
  domain: string;
  title: string;
  documentType: DocumentType;
  confidence: number;
  detectionReasons: string[];
  fullText: string;
  chunks: ExtractedChunk[];
  wordCount: number;
  charCount: number;
  isSufficient: boolean;
  insufficientReason?: string;
  timestamp: number;
  extractionMethod: 'page_agent_hybrid' | 'deterministic_dom';
}

export type ExtensionMessage =
  | { type: 'DETECT_PAGE' }
  | { type: 'DETECT_PAGE_RESPONSE'; payload: { detected: boolean; docType: DocumentType; domain: string; title: string; isSufficient: boolean } }
  | { type: 'ANALYZE_PAGE'; payload?: { forceDemo?: boolean } }
  | { type: 'ANALYZE_PAGE_PROGRESS'; payload: { step: string; percent: number } }
  | { type: 'ANALYZE_PAGE_SUCCESS'; payload: AnalysisReport }
  | { type: 'ANALYZE_PAGE_ERROR'; payload: { message: string; details?: string } }
  | { type: 'GET_LAST_REPORT' }
  | { type: 'GET_LAST_REPORT_RESPONSE'; payload: AnalysisReport | null };
