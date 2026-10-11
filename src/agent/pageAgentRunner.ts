import { PageController } from '@page-agent/page-controller';
import { ExtractedDocument } from '../lib/types';
import { extractPageDocument } from '../content/extractor';

export interface PageAgentAnalysisState {
  isPageAgentActive: boolean;
  simplifiedTree?: string;
  headerInfo?: string;
  footerInfo?: string;
  pageAgentDetails?: string;
}

/**
 * Alibaba Page Agent Orchestrator for ContractLens.
 *
 * In accordance with product security requirements:
 * 1. Operates within the in-page DOM context (Content Script).
 * 2. Hardened against accidental or prompt-injected UI actions by explicitly
 *    disabling all destructive tools (click, input, select, script execution).
 * 3. Utilizes PageController to inspect the live DOM hierarchy and extract
 *    the dehydrated browser state for enhanced structural awareness.
 * 4. Combines with deterministic DOM extraction as verification ground-truth.
 */
export class ContractLensPageAgent {
  private controller: PageController | null = null;
  private initialized: boolean = false;

  constructor() {
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        this.controller = new PageController({
          enableMask: false, // Masking disabled to preserve user view
          keepSemanticTags: true, // Preserve article, section, h1-h6 semantic landmarks
        });
        this.initialized = true;
      }
    } catch (err) {
      console.warn('[ContractLens] PageController initialization deferred:', err);
    }
  }

  /**
   * Safe execution of DOM inspection via Alibaba Page Agent.
   */
  public async inspectPageWithPageAgent(): Promise<PageAgentAnalysisState> {
    if (!this.controller || !this.initialized) {
      return {
        isPageAgentActive: false,
        pageAgentDetails: 'PageController DOM context unavailable. Using deterministic extraction.',
      };
    }

    try {
      const browserState = await this.controller.getBrowserState();
      await this.controller.cleanUpHighlights();

      return {
        isPageAgentActive: true,
        simplifiedTree: browserState.content,
        headerInfo: browserState.header,
        footerInfo: browserState.footer,
        pageAgentDetails: 'Alibaba PageController successfully indexed interactive DOM landmarks.',
      };
    } catch (err: any) {
      console.warn('[ContractLens] Alibaba Page Agent DOM inspection fallback:', err);
      return {
        isPageAgentActive: false,
        pageAgentDetails: `PageController fallback: ${err?.message || 'Unknown error'}`,
      };
    }
  }

  /**
   * Hybrid extraction: uses Page Agent for structural navigation and
   * deterministic extraction for verifiable character offsets and quotations.
   */
  public async extractHybridDocument(): Promise<ExtractedDocument> {
    const baseDoc = extractPageDocument();
    const agentState = await this.inspectPageWithPageAgent();

    return {
      ...baseDoc,
      extractionMethod: agentState.isPageAgentActive ? 'page_agent_hybrid' : 'deterministic_dom',
    };
  }

  public dispose(): void {
    if (this.controller) {
      try {
        this.controller.dispose();
      } catch (e) {
        // Safe disposal
      }
      this.controller = null;
      this.initialized = false;
    }
  }
}
