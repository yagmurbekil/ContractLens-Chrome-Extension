import { z } from 'zod';

export const DocumentTypeEnum = z.enum([
  'terms_of_service',
  'privacy_policy',
  'subscription_terms',
  'cookie_policy',
  'refund_terms',
  'data_processing_agreement',
  'other',
]);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const RiskLevelEnum = z.enum(['low', 'moderate', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

export const FindingCategoryEnum = z.enum([
  'data_sharing',
  'unilateral_changes',
  'liability_limitation',
  'arbitration_dispute',
  'auto_renewal_billing',
  'tracking_cookies',
  'data_retention',
  'termination_suspension',
  'content_rights',
  'other',
]);
export type FindingCategory = z.infer<typeof FindingCategoryEnum>;

export const FindingSeverityEnum = z.enum(['critical', 'high', 'moderate', 'low']);
export type FindingSeverity = z.infer<typeof FindingSeverityEnum>;

/**
 * Raw finding from LLM structured output.
 * All constraints strictly bounded to prevent memory exhaustion and malformed payloads.
 */
export const LLMFindingSchema = z.object({
  id: z.string().min(1).max(64),
  category: FindingCategoryEnum,
  severity: FindingSeverityEnum,
  titleTr: z.string().min(3).max(200),
  originalQuote: z.string().min(5).max(2000),
  explanationTr: z.string().min(10).max(1000),
  potentialImpactTr: z.string().min(10).max(1000),
  sourceSection: z.string().max(200).default('Genel / Belirtilmemiş'),
  startOffset: z.number().int().nonnegative().optional(),
  endOffset: z.number().int().nonnegative().optional(),
  confidence: z.number().min(0).max(1),
  uncertaintyTr: z.string().max(500).nullable().default(null),
}).strict();
export type LLMFinding = z.infer<typeof LLMFindingSchema>;

/**
 * Structured LLM response schema.
 * Rejects unexpected keys via .strict().
 */
export const LLMAnalysisResponseSchema = z.object({
  documentType: DocumentTypeEnum,
  rawRiskScore: z.number().int().min(0).max(100),
  rawRiskLevel: RiskLevelEnum,
  summaryTr: z.string().min(10).max(1500),
  findings: z.array(LLMFindingSchema).max(25),
  limitationsTr: z.array(z.string().max(300)).max(10).default([]),
  needsHumanReview: z.boolean().default(true),
  promptInjectionDetected: z.boolean().default(false),
}).strict();
export type LLMAnalysisResponse = z.infer<typeof LLMAnalysisResponseSchema>;

/**
 * JSON Schema export for external tool interoperability & automated validation.
 */
export const CONTRACT_LENS_JSON_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ContractLensAnalysisOutput",
  type: "object",
  required: [
    "documentType",
    "rawRiskScore",
    "rawRiskLevel",
    "summaryTr",
    "findings",
    "limitationsTr",
    "needsHumanReview"
  ],
  additionalProperties: false,
  properties: {
    documentType: {
      type: "string",
      enum: [
        "terms_of_service",
        "privacy_policy",
        "subscription_terms",
        "cookie_policy",
        "refund_terms",
        "data_processing_agreement",
        "other"
      ]
    },
    rawRiskScore: {
      type: "integer",
      minimum: 0,
      maximum: 100
    },
    rawRiskLevel: {
      type: "string",
      enum: ["low", "moderate", "high", "critical"]
    },
    summaryTr: {
      type: "string",
      maxLength: 1500
    },
    findings: {
      type: "array",
      maxItems: 25,
      items: {
        type: "object",
        required: [
          "id",
          "category",
          "severity",
          "titleTr",
          "originalQuote",
          "explanationTr",
          "potentialImpactTr",
          "confidence"
        ],
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          category: {
            type: "string",
            enum: [
              "data_sharing",
              "unilateral_changes",
              "liability_limitation",
              "arbitration_dispute",
              "auto_renewal_billing",
              "tracking_cookies",
              "data_retention",
              "termination_suspension",
              "content_rights",
              "other"
            ]
          },
          severity: {
            type: "string",
            enum: ["critical", "high", "moderate", "low"]
          },
          titleTr: { type: "string", maxLength: 200 },
          originalQuote: { type: "string", minLength: 5, maxLength: 2000 },
          explanationTr: { type: "string", maxLength: 1000 },
          potentialImpactTr: { type: "string", maxLength: 1000 },
          sourceSection: { type: "string", maxLength: 200 },
          startOffset: { type: "integer", minimum: 0 },
          endOffset: { type: "integer", minimum: 0 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          uncertaintyTr: { type: ["string", "null"], maxLength: 500 }
        }
      }
    },
    limitationsTr: {
      type: "array",
      items: { type: "string", maxLength: 300 }
    },
    needsHumanReview: { type: "boolean" },
    promptInjectionDetected: { type: "boolean" }
  }
};
