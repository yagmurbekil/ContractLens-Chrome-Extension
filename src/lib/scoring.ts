import { FindingSeverity, RiskLevel, FindingCategory } from './schema';
import { VerifiedFinding, ScoreBreakdown, CategoryScoreDetail, AnalysisStatus, ExtractedDocument } from './types';

export const SCORING_CONFIG = {
  severityWeights: {
    critical: 30,
    high: 20,
    moderate: 10,
    low: 5,
  } as Record<FindingSeverity, number>,

  riskThresholds: {
    critical: 75, // 75 - 100
    high: 50,     // 50 - 74
    moderate: 25, // 25 - 49
    low: 0,       // 0 - 24
  },

  categoryDiminishingMultipliers: [1.0, 0.5, 0.25],

  minWordsForConfidence: 200,
  minCharsForConfidence: 800,
};

/**
 * Maps a calculated score (0-100) to a deterministic RiskLevel enum.
 */
export function mapScoreToRiskLevel(score: number): RiskLevel {
  if (score >= SCORING_CONFIG.riskThresholds.critical) return 'critical';
  if (score >= SCORING_CONFIG.riskThresholds.high) return 'high';
  if (score >= SCORING_CONFIG.riskThresholds.moderate) return 'moderate';
  return 'low';
}

/**
 * Calculates a deterministic risk score strictly from verified findings.
 * Does NOT accept LLM hallucinated scores.
 */
export function calculateDeterministicScore(
  verifiedFindings: VerifiedFinding[],
  totalRawFindingsCount: number,
  document: ExtractedDocument
): {
  score: number;
  riskLevel: RiskLevel;
  status: AnalysisStatus;
  breakdown: ScoreBreakdown;
  statusMessageTr?: string;
} {
  // Check for insufficient data
  const wordCount = document.wordCount || document.fullText.split(/\s+/).filter(Boolean).length;
  const isInsufficient = wordCount < SCORING_CONFIG.minWordsForConfidence || !document.isSufficient;

  if (isInsufficient) {
    const reason = document.insufficientReason ||
      `Belge metni çok kısa (${wordCount} kelime, asgari ${SCORING_CONFIG.minWordsForConfidence} kelime gereklidir). Analiz güvenilmez.`;
    
    return {
      score: 0,
      riskLevel: 'low',
      status: 'insufficient_data',
      statusMessageTr: 'Yetersiz veri: Sayfa metni kapsamlı hukuki risk analizi yapmak için yetersiz.',
      breakdown: {
        baseScore: 0,
        categoryDeduplicatedScore: 0,
        finalScore: 0,
        riskLevel: 'low',
        totalFindingsEvaluated: totalRawFindingsCount,
        verifiedFindingsCount: verifiedFindings.length,
        rejectedFindingsCount: totalRawFindingsCount - verifiedFindings.length,
        categoryDetails: [],
        insufficientDataReason: reason,
      },
    };
  }

  // Group verified findings by category
  const findingsByCategory = new Map<FindingCategory, VerifiedFinding[]>();
  for (const finding of verifiedFindings) {
    const list = findingsByCategory.get(finding.category) || [];
    list.push(finding);
    findingsByCategory.set(finding.category, list);
  }

  let totalRawScore = 0;
  let totalDeduplicatedScore = 0;
  const categoryDetails: CategoryScoreDetail[] = [];

  // Calculate score per category with diminishing marginal returns
  for (const [category, items] of findingsByCategory.entries()) {
    // Sort items by severity descending so higher risk items get higher multiplier weight
    items.sort((a, b) => {
      const weightA = SCORING_CONFIG.severityWeights[a.severity];
      const weightB = SCORING_CONFIG.severityWeights[b.severity];
      return weightB - weightA;
    });

    let catScore = 0;
    let highestSev: FindingSeverity = 'low';

    items.forEach((item, index) => {
      const baseWeight = SCORING_CONFIG.severityWeights[item.severity];
      const multiplier =
        index < SCORING_CONFIG.categoryDiminishingMultipliers.length
          ? SCORING_CONFIG.categoryDiminishingMultipliers[index]
          : 0.25;

      const findingScore = baseWeight * item.confidence * multiplier;
      catScore += findingScore;
      totalRawScore += baseWeight * item.confidence;

      if (baseWeight > SCORING_CONFIG.severityWeights[highestSev]) {
        highestSev = item.severity;
      }
    });

    totalDeduplicatedScore += catScore;
    categoryDetails.push({
      category,
      findingCount: items.length,
      highestSeverity: highestSev,
      subtotalScore: Math.round(catScore),
    });
  }

  // Cap final score at 100
  const finalScore = Math.min(100, Math.max(0, Math.round(totalDeduplicatedScore)));
  const riskLevel = mapScoreToRiskLevel(finalScore);

  return {
    score: finalScore,
    riskLevel,
    status: 'valid',
    breakdown: {
      baseScore: Math.round(totalRawScore),
      categoryDeduplicatedScore: Math.round(totalDeduplicatedScore),
      finalScore,
      riskLevel,
      totalFindingsEvaluated: totalRawFindingsCount,
      verifiedFindingsCount: verifiedFindings.length,
      rejectedFindingsCount: totalRawFindingsCount - verifiedFindings.length,
      categoryDetails,
    },
  };
}
