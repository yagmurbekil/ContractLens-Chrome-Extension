import { ExtensionMessage, AnalysisReport, ExtractedDocument } from '../lib/types';
import { MockProvider } from '../backend/providers/llmProvider';
import { verifyAllFindings } from '../lib/evidence';
import { calculateDeterministicScore } from '../lib/scoring';
import { detectPromptInjection } from '../lib/security';

const BACKEND_URL = 'http://localhost:3001/api/analyze';
const localMockProvider = new MockProvider();

// Service worker message coordinator
chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  if (message.type === 'DETECT_PAGE') {
    handleDetectPage(sendResponse);
    return true; // asynchronous response
  }

  if (message.type === 'ANALYZE_PAGE') {
    handleAnalyzePage(message.payload?.forceDemo, sendResponse);
    return true; // asynchronous response
  }

  if (message.type === 'GET_LAST_REPORT') {
    chrome.storage.local.get(['contractLensLastReport'], (result) => {
      sendResponse({
        type: 'GET_LAST_REPORT_RESPONSE',
        payload: result.contractLensLastReport || null,
      });
    });
    return true;
  }

  return false;
});

async function handleDetectPage(sendResponse: (res: any) => void) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      sendResponse({
        type: 'DETECT_PAGE_RESPONSE',
        payload: { detected: false, docType: 'other', domain: '', title: '', isSufficient: false },
      });
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_METADATA' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        sendResponse({
          type: 'DETECT_PAGE_RESPONSE',
          payload: {
            detected: false,
            docType: 'other',
            domain: tab.url ? new URL(tab.url).hostname : '',
            title: tab.title || '',
            isSufficient: false,
          },
        });
      } else {
        sendResponse({
          type: 'DETECT_PAGE_RESPONSE',
          payload: response,
        });
      }
    });
  } catch (err) {
    sendResponse({
      type: 'DETECT_PAGE_RESPONSE',
      payload: { detected: false, docType: 'other', domain: '', title: '', isSufficient: false },
    });
  }
}

async function handleAnalyzePage(forceDemo: boolean | undefined, sendResponse: (res: any) => void) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      sendResponse({
        type: 'ANALYZE_PAGE_ERROR',
        payload: { message: 'Aktif tarayıcı sekmesi bulunamadı.' },
      });
      return;
    }

    // Step 1: Request document extraction from Content Script (combining Page Agent and DOM)
    chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_FULL_DOCUMENT' }, async (docResponse: { document?: ExtractedDocument; error?: string }) => {
      if (chrome.runtime.lastError || !docResponse || !docResponse.document) {
        sendResponse({
          type: 'ANALYZE_PAGE_ERROR',
          payload: {
            message: 'Sayfa metni çıkarılamadı. Lütfen sayfayı yenileyip tekrar deneyin.',
            details: chrome.runtime.lastError?.message,
          },
        });
        return;
      }

      const doc = docResponse.document;

      // Step 2: Try Backend server; fallback to built-in local client analysis if backend is offline
      let finalReport: AnalysisReport;

      try {
        if (forceDemo) {
          throw new Error('Force demo mode requested');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const backendRes = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: doc, forceDemo: false }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!backendRes.ok) {
          throw new Error(`Backend returned status ${backendRes.status}`);
        }

        finalReport = await backendRes.json();
      } catch (backendError) {
        console.info('[ContractLens Background] Using local embedded engine (Backend offline or Demo mode):', backendError);

        // Run local deterministic pipeline
        const injection = detectPromptInjection(doc.fullText);
        const rawAnalysis = await localMockProvider.analyzeContract(doc.fullText, {
          url: doc.url,
          domain: doc.domain,
          docType: doc.documentType,
          title: doc.title,
        });

        const { verifiedFindings, rejectedFindings } = verifyAllFindings(rawAnalysis.findings, doc);
        const { score, riskLevel, status, breakdown, statusMessageTr } = calculateDeterministicScore(
          verifiedFindings,
          rawAnalysis.findings.length,
          doc
        );

        finalReport = {
          documentType: rawAnalysis.documentType,
          status: injection.detected ? 'security_alert' : status,
          overallRiskScore: score,
          riskLevel,
          summaryTr: statusMessageTr || rawAnalysis.summaryTr,
          verifiedFindings,
          rejectedFindings,
          scoreBreakdown: breakdown,
          limitationsTr: [
            ...rawAnalysis.limitationsTr,
            'Yerel gömülü analiz motoru devrede. Doğrulanmış alıntılar belge metninden çıkarılmıştır.',
          ],
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
            extractionMethod: doc.extractionMethod,
          },
        };
      }

      // Save report in local storage for popup and sidepanel persistence
      await chrome.storage.local.set({ contractLensLastReport: finalReport });

      sendResponse({
        type: 'ANALYZE_PAGE_SUCCESS',
        payload: finalReport,
      });
    });
  } catch (error: any) {
    sendResponse({
      type: 'ANALYZE_PAGE_ERROR',
      payload: { message: error?.message || 'Bilinmeyen hata' },
    });
  }
}
