// Cypress support configuration for ContractLens E2E testing
import { MockProvider } from '../../src/backend/providers/llmProvider';
import { verifyAllFindings } from '../../src/lib/evidence';
import { calculateDeterministicScore } from '../../src/lib/scoring';
import { detectPromptInjection } from '../../src/lib/security';
import { extractPageDocument, classifyDocument } from '../../src/content/extractor';
import { ExtractedDocument, AnalysisReport } from '../../src/lib/types';

const mockProvider = new MockProvider();
let activeReport: AnalysisReport | null = null;
let currentFixtureDoc: ExtractedDocument | null = null;

Cypress.on('window:before:load', (win: any) => {
  // Ensure chrome runtime mock is available in the test window
  win.chrome = win.chrome || {};
  win.chrome.storage = win.chrome.storage || {
    local: {
      get: (keys: any, cb: any) => {
        cb({ contractLensLastReport: activeReport });
      },
      set: (obj: any, cb: any) => {
        if (obj.contractLensLastReport) {
          activeReport = obj.contractLensLastReport;
        }
        if (cb) cb();
      },
    },
  };

  win.chrome.tabs = win.chrome.tabs || {
    query: (queryInfo: any) => Promise.resolve([{ id: 1, url: win.location.href, title: win.document.title }]),
    sendMessage: (tabId: number, msg: any, cb: any) => {
      if (msg.type === 'EXTRACT_METADATA') {
        const url = win.location.href;
        const title = win.document.title || 'Fixture';
        const bodyText = win.document.body?.innerText || '';
        const classification = classifyDocument(url, title, bodyText);
        const words = bodyText.split(/\s+/).filter(Boolean).length;
        cb({
          detected: classification.docType !== 'other' || classification.confidence > 0.3,
          docType: classification.docType,
          domain: win.location.hostname,
          title,
          isSufficient: words >= 200,
          wordCount: words,
        });
      } else if (msg.type === 'EXTRACT_FULL_DOCUMENT') {
        const doc = extractPageDocument();
        currentFixtureDoc = doc;
        cb({ document: doc });
      }
    },
  };

  win.chrome.runtime = win.chrome.runtime || {
    sendMessage: (msg: any, cb: any) => {
      if (msg.type === 'DETECT_PAGE') {
        const url = win.location.href;
        const title = win.document.title || 'Fixture Page';
        const bodyText = win.document.body?.innerText || '';
        const classification = classifyDocument(url, title, bodyText);
        const words = bodyText.split(/\s+/).filter(Boolean).length;
        const res = {
          payload: {
            detected: classification.docType !== 'other' || classification.confidence > 0.3,
            docType: classification.docType,
            domain: 'acmecloud.example.com',
            title,
            isSufficient: words >= 200,
          },
        };
        if (cb) cb(res);
        return;
      }

      if (msg.type === 'ANALYZE_PAGE') {
        const bodyText = win.document.body?.innerText || '';
        const words = bodyText.split(/\s+/).filter(Boolean);
        const isSufficient = words.length >= 200;

        const doc: ExtractedDocument = currentFixtureDoc || {
          url: win.location.href,
          domain: 'acmecloud.example.com',
          title: win.document.title || 'Fixture Document',
          documentType: classifyDocument(win.location.href, win.document.title, bodyText).docType,
          confidence: 0.9,
          detectionReasons: ['Cypress E2E test extract'],
          fullText: bodyText,
          chunks: [
            {
              id: 'c-test-0',
              index: 0,
              sectionHeading: 'Document Text',
              text: bodyText,
              startOffset: 0,
              endOffset: bodyText.length,
              charCount: bodyText.length,
            },
          ],
          wordCount: words.length,
          charCount: bodyText.length,
          isSufficient,
          insufficientReason: isSufficient ? undefined : 'Sayfa metni 200 kelimeden az. Analiz belirsiz.',
          timestamp: Date.now(),
          extractionMethod: 'deterministic_dom',
        };

        const injection = detectPromptInjection(doc.fullText);

        mockProvider.analyzeContract(doc.fullText, {
          url: doc.url,
          domain: doc.domain,
          docType: doc.documentType,
          title: doc.title,
        }).then((rawAnalysis) => {
          const { verifiedFindings, rejectedFindings } = verifyAllFindings(rawAnalysis.findings, doc);
          const scoring = calculateDeterministicScore(verifiedFindings, rawAnalysis.findings.length, doc);

          const report: AnalysisReport = {
            documentType: rawAnalysis.documentType,
            status: injection.detected ? 'security_alert' : scoring.status,
            overallRiskScore: scoring.score,
            riskLevel: scoring.riskLevel,
            summaryTr: scoring.statusMessageTr || rawAnalysis.summaryTr,
            verifiedFindings,
            rejectedFindings,
            scoreBreakdown: scoring.breakdown,
            limitationsTr: rawAnalysis.limitationsTr,
            needsHumanReview: true,
            promptInjectionDetected: injection.detected,
            promptInjectionWarnings: injection.warningsTr,
            documentMetadata: {
              url: doc.url,
              domain: doc.domain,
              title: doc.title,
              wordCount: doc.wordCount,
              charCount: doc.charCount,
              analyzedAt: new Date().toISOString(),
              extractionMethod: 'page_agent_hybrid',
            },
          };

          activeReport = report;
          if (cb) cb({ type: 'ANALYZE_PAGE_SUCCESS', payload: report });
        });
        return;
      }

      if (msg.type === 'GET_LAST_REPORT') {
        if (cb) cb({ payload: activeReport });
        return;
      }
    },
  };
});
