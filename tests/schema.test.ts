import { describe, it, expect } from 'vitest';
import { LLMAnalysisResponseSchema, LLMFindingSchema } from '../src/lib/schema';

describe('Strict JSON Schema Validation', () => {
  it('validates a correct structured analysis payload', () => {
    const validPayload = {
      documentType: 'privacy_policy',
      rawRiskScore: 72,
      rawRiskLevel: 'high',
      summaryTr: 'Belgede dikkat edilmesi gereken maddeler bulunmaktadır.',
      findings: [
        {
          id: 'risk-001',
          category: 'data_sharing',
          severity: 'high',
          titleTr: 'Verilerin üçüncü taraflarla paylaşılması',
          originalQuote: 'We may share your personal data with third-party advertising partners.',
          explanationTr: 'Bu madde, verilerinizin belirtilen üçüncü taraflarla paylaşılmasına izin verebilir.',
          potentialImpactTr: 'Kişisel bilgilerinizin kimlerle paylaşılacağını kontrol etmek zorlaşabilir.',
          sourceSection: 'Data Sharing',
          confidence: 0.93,
          uncertaintyTr: null,
        },
      ],
      limitationsTr: ['Örnek sınırlama'],
      needsHumanReview: true,
      promptInjectionDetected: false,
    };

    const parsed = LLMAnalysisResponseSchema.parse(validPayload);
    expect(parsed.documentType).toBe('privacy_policy');
    expect(parsed.findings.length).toBe(1);
    expect(parsed.findings[0].category).toBe('data_sharing');
  });

  it('rejects unexpected properties due to strict schema rules', () => {
    const maliciousExtraKeyPayload = {
      documentType: 'terms_of_service',
      rawRiskScore: 40,
      rawRiskLevel: 'moderate',
      summaryTr: 'Standart sözleşme özeti.',
      findings: [],
      limitationsTr: [],
      needsHumanReview: false,
      promptInjectionDetected: false,
      unauthorizedSecretField: 'attacker_controlled_payload', // Unexpected property
    };

    expect(() => LLMAnalysisResponseSchema.parse(maliciousExtraKeyPayload)).toThrow();
  });

  it('rejects invalid enums and out-of-range confidence values', () => {
    const invalidFinding = {
      id: 'f-invalid',
      category: 'illegal_category_value', // Invalid enum
      severity: 'extreme', // Invalid enum (only critical, high, moderate, low allowed)
      titleTr: 'Geçersiz Madde',
      originalQuote: 'Test quote here',
      explanationTr: 'Geçersiz açıklama metni.',
      potentialImpactTr: 'Geçersiz etki metni.',
      confidence: 1.5, // Out of range (> 1.0)
    };

    expect(() => LLMFindingSchema.parse(invalidFinding)).toThrow();
  });

  it('rejects empty or overly short quotations', () => {
    const shortQuoteFinding = {
      id: 'f-short',
      category: 'other',
      severity: 'low',
      titleTr: 'Kısa Alıntı',
      originalQuote: 'abc', // Too short (< 5 chars)
      explanationTr: 'Açıklama metni test için yazıldı.',
      potentialImpactTr: 'Etki metni test için yazıldı.',
      confidence: 0.8,
    };

    expect(() => LLMFindingSchema.parse(shortQuoteFinding)).toThrow();
  });
});
