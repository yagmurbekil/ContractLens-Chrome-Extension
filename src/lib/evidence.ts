import { LLMFinding } from './schema';
import { VerifiedFinding, ExtractedDocument } from './types';

/**
 * Consistently normalize unicode and whitespace for exact legal text matching.
 * Preserves words, punctuation, and linguistic integrity while stripping arbitrary
 * web formatting artifacts (e.g., non-breaking spaces, zero-width characters, multiple spaces).
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKC')
    // Replace smart quotes and dashes with standardized representations for robust comparison
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    // Replace non-breaking spaces, zero-width spaces, hair spaces
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // Collapse all whitespace sequences into a single space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Deterministically verifies an LLM finding against the extracted document.
 * Adheres strictly to the requirement: NO fuzzy-guessing hallucinations into verified facts.
 */
export function verifyFindingAgainstDocument(
  finding: LLMFinding,
  document: ExtractedDocument
): VerifiedFinding {
  const normalizedDoc = normalizeText(document.fullText);
  const normalizedQuote = normalizeText(finding.originalQuote);

  // Guard: quotation too short or empty
  if (normalizedQuote.length < 10) {
    return {
      ...finding,
      verified: false,
      verificationStatus: 'unverified_too_short',
      verificationDetails: 'Alıntı metin doğrulama için yetersiz uzunlukta (<10 karakter).',
    };
  }

  // Exact matching on normalized text
  const matchIndex = normalizedDoc.indexOf(normalizedQuote);

  if (matchIndex === -1) {
    // If not found in full normalized text, verify if quote is present in any specific chunk
    let foundInChunk = false;
    let chunkStart = -1;
    let matchedChunkHeading = '';

    for (const chunk of document.chunks) {
      const normalizedChunk = normalizeText(chunk.text);
      const idx = normalizedChunk.indexOf(normalizedQuote);
      if (idx !== -1) {
        foundInChunk = true;
        chunkStart = chunk.startOffset + idx;
        matchedChunkHeading = chunk.sectionHeading;
        break;
      }
    }

    if (foundInChunk) {
      return {
        ...finding,
        verified: true,
        verificationStatus: 'verified_normalized',
        verificationDetails: `Alıntı bölüm parçası (${matchedChunkHeading}) içerisinde doğrulandı.`,
        matchedText: finding.originalQuote,
        matchedOffsets: {
          start: chunkStart,
          end: chunkStart + normalizedQuote.length,
        },
      };
    }

    // Quotation could not be verified in the document
    return {
      ...finding,
      verified: false,
      verificationStatus: 'unverified_not_found',
      verificationDetails: 'Belirtilen alıntı orijinal belge metninde bulunamadı. Halüsinasyon veya çarpıtma şüphesi nedeniyle reddedildi.',
    };
  }

  // Check if multiple occurrences exist causing ambiguity
  const nextOccurrence = normalizedDoc.indexOf(normalizedQuote, matchIndex + 1);
  const isAmbiguous = nextOccurrence !== -1 && normalizedQuote.length < 25;

  if (isAmbiguous) {
    return {
      ...finding,
      verified: false,
      verificationStatus: 'unverified_ambiguous',
      verificationDetails: 'Kısa alıntı metin belgede birden fazla yerde geçiyor ve tam bağlam tespit edilemedi.',
    };
  }

  return {
    ...finding,
    verified: true,
    verificationStatus: 'verified_exact',
    verificationDetails: 'Alıntı orijinal belge metninde birebir doğrulandı.',
    matchedText: finding.originalQuote,
    matchedOffsets: {
      start: matchIndex,
      end: matchIndex + normalizedQuote.length,
    },
  };
}

/**
 * Processes all findings from an LLM response and strictly separates them into
 * verified and rejected collections.
 */
export function verifyAllFindings(
  rawFindings: LLMFinding[],
  document: ExtractedDocument
): {
  verifiedFindings: VerifiedFinding[];
  rejectedFindings: VerifiedFinding[];
} {
  const verifiedFindings: VerifiedFinding[] = [];
  const rejectedFindings: VerifiedFinding[] = [];

  for (const raw of rawFindings) {
    const verified = verifyFindingAgainstDocument(raw, document);
    if (verified.verified) {
      verifiedFindings.push(verified);
    } else {
      rejectedFindings.push(verified);
    }
  }

  return { verifiedFindings, rejectedFindings };
}
