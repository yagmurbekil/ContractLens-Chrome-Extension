import { describe, it, expect } from 'vitest';
import { normalizeText, verifyFindingAgainstDocument, verifyAllFindings } from '../src/lib/evidence';
import { ExtractedDocument } from '../src/lib/types';
import { LLMFinding } from '../src/lib/schema';

describe('Deterministic Evidence Verification Engine', () => {
  const sampleDocText = `
    1. Introduction and Scope
    Welcome to ACME Services. By accessing our platform, you agree to these Terms.

    2. Unilateral Modifications
    We reserve the right, at our sole discretion, to modify or replace these Terms at any time without prior notice.

    3. Data Sharing with Third Parties
    We may disclose your personal information, including geolocation data, to commercial advertisers and affiliates.
  `;

  const dummyDoc: ExtractedDocument = {
    url: 'https://example.com/terms',
    domain: 'example.com',
    title: 'ACME Terms of Service',
    documentType: 'terms_of_service',
    confidence: 0.9,
    detectionReasons: [],
    fullText: sampleDocText,
    chunks: [
      {
        id: 'chunk-0',
        index: 0,
        sectionHeading: 'Terms',
        text: sampleDocText,
        startOffset: 0,
        endOffset: sampleDocText.length,
        charCount: sampleDocText.length,
      },
    ],
    wordCount: 250,
    charCount: sampleDocText.length,
    isSufficient: true,
    timestamp: Date.now(),
    extractionMethod: 'deterministic_dom',
  };

  it('normalizes irregular whitespace and quotes consistently', () => {
    const raw = "We  reserve\u00A0the right, \u201Cto modify\u201D these   Terms.";
    const normalized = normalizeText(raw);
    expect(normalized).toBe('We reserve the right, "to modify" these Terms.');
  });

  it('successfully verifies exact and normalized verbatim quotations', () => {
    const finding: LLMFinding = {
      id: 'f-1',
      category: 'unilateral_changes',
      severity: 'high',
      titleTr: 'Tek taraflı değişiklik hakkı',
      originalQuote: 'We reserve the right, at our sole discretion, to modify or replace these Terms at any time without prior notice.',
      explanationTr: 'Önceden haber vermeksizin şartları değiştirme hakkı saklı tutuluyor.',
      potentialImpactTr: 'Şartlar haberiniz olmadan aleyhinize güncellenebilir.',
      sourceSection: 'Unilateral Modifications',
      confidence: 0.95,
      uncertaintyTr: null,
    };

    const verified = verifyFindingAgainstDocument(finding, dummyDoc);
    expect(verified.verified).toBe(true);
    expect(verified.verificationStatus).toBe('verified_exact');
    expect(verified.matchedOffsets).toBeDefined();
    expect(verified.matchedOffsets!.start).toBeGreaterThan(0);
  });

  it('strictly rejects fabricated quotations (hallucination defense)', () => {
    const fabricatedFinding: LLMFinding = {
      id: 'f-fake',
      category: 'arbitration_dispute',
      severity: 'critical',
      titleTr: 'Zorunlu Tahkim Şartı',
      originalQuote: 'You agree that all disputes shall be resolved by binding arbitration in Delaware.', // Not in document!
      explanationTr: 'Mahkemeye gitme hakkınız elinizden alınıyor.',
      potentialImpactTr: 'Bireysel hak arama zorlaşır.',
      sourceSection: 'Dispute Resolution',
      confidence: 0.99,
      uncertaintyTr: null,
    };

    const verified = verifyFindingAgainstDocument(fabricatedFinding, dummyDoc);
    expect(verified.verified).toBe(false);
    expect(verified.verificationStatus).toBe('unverified_not_found');
    expect(verified.verificationDetails).toContain('orijinal belge metninde bulunamadı');
  });

  it('rejects overly short quotes that could match trivially or ambiguously', () => {
    const shortQuoteFinding: LLMFinding = {
      id: 'f-short',
      category: 'other',
      severity: 'low',
      titleTr: 'Kısa Sözcük',
      originalQuote: 'Terms', // < 10 chars
      explanationTr: 'Kısa kelime testi.',
      potentialImpactTr: 'Bağlam eksikliği.',
      sourceSection: 'General',
      confidence: 0.5,
      uncertaintyTr: null,
    };

    const verified = verifyFindingAgainstDocument(shortQuoteFinding, dummyDoc);
    expect(verified.verified).toBe(false);
    expect(verified.verificationStatus).toBe('unverified_too_short');
  });

  it('filters all findings into verified and rejected collections', () => {
    const findings: LLMFinding[] = [
      {
        id: 'f-real',
        category: 'data_sharing',
        severity: 'high',
        titleTr: 'Veri paylaşımı',
        originalQuote: 'We may disclose your personal information, including geolocation data, to commercial advertisers and affiliates.',
        explanationTr: 'Veriler reklam verenlerle paylaşılıyor.',
        potentialImpactTr: 'Gizlilik kaybı.',
        sourceSection: 'Data Sharing',
        confidence: 0.92,
        uncertaintyTr: null,
      },
      {
        id: 'f-fake',
        category: 'liability_limitation',
        severity: 'critical',
        titleTr: 'Uydurma Muafiyet',
        originalQuote: 'The company is completely immune from all gross negligence claims.',
        explanationTr: 'Sahte madde.',
        potentialImpactTr: 'Sahte etki.',
        sourceSection: 'Liability',
        confidence: 0.85,
        uncertaintyTr: null,
      },
    ];

    const result = verifyAllFindings(findings, dummyDoc);
    expect(result.verifiedFindings.length).toBe(1);
    expect(result.verifiedFindings[0].id).toBe('f-real');
    expect(result.rejectedFindings.length).toBe(1);
    expect(result.rejectedFindings[0].id).toBe('f-fake');
  });
});
