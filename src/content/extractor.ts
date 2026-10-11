import { DocumentType } from '../lib/schema';
import { ExtractedChunk, ExtractedDocument } from '../lib/types';
import { normalizeText } from '../lib/evidence';

interface ClassificationRule {
  type: DocumentType;
  urlKeywords: string[];
  titleKeywords: string[];
  bodyKeywords: string[];
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    type: 'terms_of_service',
    urlKeywords: ['terms', 'tos', 'conditions', 'kullanim-kosullari', 'sozlesme', 'user-agreement'],
    titleKeywords: ['terms of service', 'terms of use', 'terms & conditions', 'kullanım koşulları', 'kullanıcı sözleşmesi'],
    bodyKeywords: ['governing law', 'binding arbitration', 'limitation of liability', 'these terms', 'uyuşmazlık', 'tahkim', 'yetkili mahkeme'],
  },
  {
    type: 'privacy_policy',
    urlKeywords: ['privacy', 'gizlilik', 'kvkk', 'data-protection', 'gdpr', 'aydinlatma-metni'],
    titleKeywords: ['privacy policy', 'gizlilik politikası', 'privacy notice', 'aydınlatma metni', 'data policy'],
    bodyKeywords: ['personal data', 'personal information', 'we collect', 'third-party disclosure', 'kişisel veriler', 'veri işleme', 'çerezler ve izleyiciler'],
  },
  {
    type: 'subscription_terms',
    urlKeywords: ['subscription', 'billing', 'cancellation', 'abonelik', 'odeme', 'renewal', 'refund-policy'],
    titleKeywords: ['subscription terms', 'billing terms', 'abonelik koşulları', 'cancellation policy', 'iptal ve iade'],
    bodyKeywords: ['auto-renew', 'automatic renewal', 'recurring billing', 'cancellation period', 'otomatik yenileme', 'abonelik ücreti', 'cayma hakkı'],
  },
  {
    type: 'cookie_policy',
    urlKeywords: ['cookie', 'cerez', 'cookies-policy'],
    titleKeywords: ['cookie policy', 'çerez politikası', 'cookies notice'],
    bodyKeywords: ['cookies', 'browser cookies', 'tracking technologies', 'çerezler', 'piksel etiketleri'],
  },
  {
    type: 'refund_terms',
    urlKeywords: ['refund', 'return', 'iade', 'cayma'],
    titleKeywords: ['refund policy', 'return policy', 'iade koşulları', 'cayma hakkı bildirimi'],
    bodyKeywords: ['refund request', 'within 14 days', 'non-refundable', 'iade talebi', 'para iadesi'],
  },
  {
    type: 'data_processing_agreement',
    urlKeywords: ['dpa', 'data-processing', 'veri-isleme'],
    titleKeywords: ['data processing agreement', 'data processing addendum', 'dpa', 'veri işleme sözleşmesi'],
    bodyKeywords: ['data controller', 'data processor', 'sub-processor', 'standard contractual clauses', 'veri sorumlusu'],
  },
];

/**
 * Classifies document type using URL, title, and body keywords.
 */
export function classifyDocument(
  url: string,
  title: string,
  bodyExcerpt: string
): { docType: DocumentType; confidence: number; reasons: string[] } {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const lowerExcerpt = bodyExcerpt.toLowerCase();

  let bestType: DocumentType = 'other';
  let bestScore = 0;
  const bestReasons: string[] = [];

  for (const rule of CLASSIFICATION_RULES) {
    let score = 0;
    const reasons: string[] = [];

    // URL matching (High weight)
    for (const kw of rule.urlKeywords) {
      if (lowerUrl.includes(kw)) {
        score += 35;
        reasons.push(`URL anahtar kelimesi: "${kw}"`);
        break;
      }
    }

    // Title matching (High weight)
    for (const kw of rule.titleKeywords) {
      if (lowerTitle.includes(kw)) {
        score += 35;
        reasons.push(`Başlık eşleşmesi: "${kw}"`);
        break;
      }
    }

    // Body content matching
    let bodyHits = 0;
    for (const kw of rule.bodyKeywords) {
      if (lowerExcerpt.includes(kw)) {
        score += 10;
        bodyHits++;
      }
    }
    if (bodyHits > 0) {
      reasons.push(`Metin içi ${bodyHits} ilgili hukuki kavram eşleşti`);
    }

    if (score > bestScore) {
      bestScore = score;
      bestType = rule.type;
      bestReasons.length = 0;
      bestReasons.push(...reasons);
    }
  }

  const confidence = Math.min(1.0, bestScore / 80);
  return {
    docType: bestScore >= 25 ? bestType : 'other',
    confidence,
    reasons: bestReasons,
  };
}

/**
 * Extracts clean, readable text from DOM, filtering ads, navigation, forms, scripts.
 */
export function extractCleanDomText(rootElement: HTMLElement = document.body): {
  fullText: string;
  sections: { heading: string; text: string }[];
} {
  // Elements to strictly exclude from legal text extraction
  const EXCLUDED_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'SVG', 'NAV', 'HEADER', 'FOOTER',
    'ASIDE', 'FORM', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'
  ]);

  const sections: { heading: string; text: string }[] = [];
  let currentHeading = 'Giriş / Genel Koşullar';
  let currentSectionLines: string[] = [];

  function flushSection() {
    if (currentSectionLines.length > 0) {
      const sectionText = currentSectionLines.join('\n').trim();
      if (sectionText.length > 20) {
        sections.push({ heading: currentHeading, text: sectionText });
      }
      currentSectionLines = [];
    }
  }

  function walk(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      // Skip non-legal noise tags
      if (EXCLUDED_TAGS.has(tagName)) return;

      // Skip hidden elements
      const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')) {
        return;
      }

      // Skip elements matching ad or cookie banner classes
      const className = typeof el.className === 'string' ? el.className.toLowerCase() : '';
      if (
        className.includes('cookie-banner') ||
        className.includes('ad-container') ||
        className.includes('nav-bar')
      ) {
        return;
      }

      // Detect section headings
      if (/^H[1-6]$/.test(tagName)) {
        flushSection();
        const headingText = el.textContent?.trim() || '';
        if (headingText) {
          currentHeading = headingText;
        }
        return;
      }

      // Check for block text elements
      if (['P', 'LI', 'BLOCKQUOTE', 'ARTICLE', 'SECTION', 'DIV'].includes(tagName)) {
        for (const child of Array.from(el.childNodes)) {
          walk(child);
        }
        return;
      }

      for (const child of Array.from(el.childNodes)) {
        walk(child);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() || '';
      if (text.length > 0) {
        currentSectionLines.push(text);
      }
    }
  }

  walk(rootElement);
  flushSection();

  const fullText = sections.map(s => `## ${s.heading}\n${s.text}`).join('\n\n');
  return { fullText, sections };
}

/**
 * Divides long legal documents into overlapping traceable chunks.
 * Preserves startOffset, endOffset, sectionHeading, and chunk IDs.
 */
export function chunkDocument(
  sections: { heading: string; text: string }[],
  targetChunkChars: number = 2000,
  overlapChars: number = 200
): ExtractedChunk[] {
  const chunks: ExtractedChunk[] = [];
  let globalOffset = 0;
  let chunkIndex = 0;

  for (const sec of sections) {
    const secText = `## ${sec.heading}\n${sec.text}\n\n`;
    const secLength = secText.length;

    if (secLength <= targetChunkChars) {
      chunks.push({
        id: `chunk-${chunkIndex++}`,
        index: chunkIndex,
        sectionHeading: sec.heading,
        text: secText,
        startOffset: globalOffset,
        endOffset: globalOffset + secLength,
        charCount: secLength,
      });
      globalOffset += secLength;
    } else {
      // Divide oversized section into overlapping windows
      let start = 0;
      while (start < secLength) {
        const end = Math.min(start + targetChunkChars, secLength);
        const subText = secText.slice(start, end);
        chunks.push({
          id: `chunk-${chunkIndex++}`,
          index: chunkIndex,
          sectionHeading: sec.heading,
          text: subText,
          startOffset: globalOffset + start,
          endOffset: globalOffset + end,
          charCount: subText.length,
        });

        if (end === secLength) break;
        start += targetChunkChars - overlapChars;
      }
      globalOffset += secLength;
    }
  }

  return chunks;
}

/**
 * Comprehensive in-page document extraction.
 */
export function extractPageDocument(): ExtractedDocument {
  const url = window.location.href;
  const domain = window.location.hostname;
  const title = document.title || 'Untitled Document';

  const { fullText, sections } = extractCleanDomText(document.body);
  const normalizedFull = normalizeText(fullText);
  const words = normalizedFull.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = normalizedFull.length;

  const classification = classifyDocument(url, title, normalizedFull.slice(0, 3000));
  const chunks = chunkDocument(sections);

  const isSufficient = wordCount >= 200;
  const insufficientReason = isSufficient
    ? undefined
    : `Sayfadan yalnızca ${wordCount} kelime çıkarılabildi (güvenilir hukuki analiz için asgari 200 kelime gereklidir).`;

  return {
    url,
    domain,
    title,
    documentType: classification.docType,
    confidence: classification.confidence,
    detectionReasons: classification.reasons,
    fullText: normalizedFull,
    chunks,
    wordCount,
    charCount,
    isSufficient,
    insufficientReason,
    timestamp: Date.now(),
    extractionMethod: 'deterministic_dom',
  };
}
