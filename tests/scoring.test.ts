import { describe, it, expect } from 'vitest';
import { calculateDeterministicScore, mapScoreToRiskLevel } from '../src/lib/scoring';
import { VerifiedFinding, ExtractedDocument } from '../src/lib/types';

describe('Deterministic Risk Scoring Engine', () => {
  const validDoc: ExtractedDocument = {
    url: 'https://example.com/terms',
    domain: 'example.com',
    title: 'Terms of Service',
    documentType: 'terms_of_service',
    confidence: 0.95,
    detectionReasons: [],
    fullText: 'Long legal text with more than two hundred words... '.repeat(30),
    chunks: [],
    wordCount: 300,
    charCount: 1800,
    isSufficient: true,
    timestamp: Date.now(),
    extractionMethod: 'deterministic_dom',
  };

  it('correctly maps scores to fixed risk level thresholds', () => {
    expect(mapScoreToRiskLevel(15)).toBe('low');
    expect(mapScoreToRiskLevel(25)).toBe('moderate');
    expect(mapScoreToRiskLevel(49)).toBe('moderate');
    expect(mapScoreToRiskLevel(50)).toBe('high');
    expect(mapScoreToRiskLevel(74)).toBe('high');
    expect(mapScoreToRiskLevel(75)).toBe('critical');
    expect(mapScoreToRiskLevel(100)).toBe('critical');
  });

  it('computes transparent scores with category diminishing returns', () => {
    const verifiedFindings: VerifiedFinding[] = [
      {
        id: '1',
        category: 'data_sharing',
        severity: 'high', // base weight 20
        titleTr: 'Madde 1',
        originalQuote: 'Quote 1',
        explanationTr: 'Exp 1',
        potentialImpactTr: 'Imp 1',
        sourceSection: 'Sec 1',
        confidence: 1.0,
        uncertaintyTr: null,
        verified: true,
        verificationStatus: 'verified_exact',
        verificationDetails: 'OK',
      },
      {
        id: '2',
        category: 'data_sharing', // same category -> 50% decay (20 * 0.5 = 10)
        severity: 'high',
        titleTr: 'Madde 2',
        originalQuote: 'Quote 2',
        explanationTr: 'Exp 2',
        potentialImpactTr: 'Imp 2',
        sourceSection: 'Sec 2',
        confidence: 1.0,
        uncertaintyTr: null,
        verified: true,
        verificationStatus: 'verified_exact',
        verificationDetails: 'OK',
      },
    ];

    const result = calculateDeterministicScore(verifiedFindings, 2, validDoc);
    expect(result.status).toBe('valid');
    // Category subtotal: 20*1.0 + 20*0.5 = 30
    expect(result.score).toBe(30);
    expect(result.riskLevel).toBe('moderate');
    expect(result.breakdown.baseScore).toBe(40); // Raw un-deduplicated
    expect(result.breakdown.categoryDeduplicatedScore).toBe(30);
  });

  it('safely handles insufficient data without declaring false low-risk safety', () => {
    const shortDoc: ExtractedDocument = {
      ...validDoc,
      fullText: 'Short page text with only ten words.',
      wordCount: 8,
      isSufficient: false,
      insufficientReason: 'Sayfa metni 8 kelime, asgari 200 kelime gereklidir.',
    };

    const result = calculateDeterministicScore([], 0, shortDoc);
    expect(result.status).toBe('insufficient_data');
    expect(result.statusMessageTr).toContain('Yetersiz veri');
    expect(result.breakdown.insufficientDataReason).toBeDefined();
  });
});
