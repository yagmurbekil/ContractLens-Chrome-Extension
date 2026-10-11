import { ContractLensPageAgent } from '../agent/pageAgentRunner';
import { extractPageDocument, classifyDocument } from './extractor';

const pageAgent = new ContractLensPageAgent();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_METADATA') {
    try {
      const url = window.location.href;
      const domain = window.location.hostname;
      const title = document.title || '';
      const bodyExcerpt = document.body?.innerText?.slice(0, 3000) || '';
      const classification = classifyDocument(url, title, bodyExcerpt);
      const words = (document.body?.innerText || '').split(/\s+/).filter(Boolean).length;

      sendResponse({
        detected: classification.docType !== 'other' || classification.confidence > 0.3,
        docType: classification.docType,
        domain,
        title,
        isSufficient: words >= 200,
        wordCount: words,
      });
    } catch (e: any) {
      sendResponse({
        detected: false,
        docType: 'other',
        domain: window.location.hostname,
        title: document.title,
        isSufficient: false,
        wordCount: 0,
      });
    }
    return true;
  }

  if (message.type === 'EXTRACT_FULL_DOCUMENT') {
    (async () => {
      try {
        const doc = await pageAgent.extractHybridDocument();
        sendResponse({ document: doc });
      } catch (err: any) {
        console.warn('[ContractLens Content Script] Page Agent extraction fallback to pure DOM:', err);
        const fallbackDoc = extractPageDocument();
        sendResponse({ document: fallbackDoc });
      }
    })();
    return true; // asynchronous response
  }

  return false;
});
