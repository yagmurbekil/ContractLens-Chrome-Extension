import express from 'express';
import cors from 'cors';
import { getBackendConfig } from './config';
import { createLLMProvider, MockProvider } from './providers/llmProvider';
import { ExtractedDocument, AnalysisReport } from '../lib/types';
import { detectPromptInjection } from '../lib/security';
import { verifyAllFindings } from '../lib/evidence';
import { calculateDeterministicScore } from '../lib/scoring';

const app = express();
const config = getBackendConfig();
const primaryProvider = createLLMProvider(config);
const mockProvider = new MockProvider();

// Enable CORS for Chrome Extension origins and localhost
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeProvider: config.LLM_PROVIDER,
    demoModeSupported: true,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Analyze Contract Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { document: doc, forceDemo } = req.body as {
      document?: ExtractedDocument;
      forceDemo?: boolean;
    };

    if (!doc || !doc.fullText) {
      return res.status(400).json({ error: 'Geçersiz istek: Belge metni eksik.' });
    }

    // Step 1: Prompt Injection Security Scan
    const injectionCheck = detectPromptInjection(doc.fullText);

    // Step 2: Choose active provider
    const providerToUse = forceDemo || config.LLM_PROVIDER === 'mock' ? mockProvider : primaryProvider;

    console.log(`[ContractLens Backend] Analyzing contract from ${doc.domain} (${doc.wordCount} words) using [${providerToUse.name}]`);

    // Step 3: Run LLM analysis
    const rawAnalysis = await providerToUse.analyzeContract(doc.fullText, {
      url: doc.url,
      domain: doc.domain,
      docType: doc.documentType,
      title: doc.title,
    });

    // Step 4: Deterministic Evidence Verification
    const { verifiedFindings, rejectedFindings } = verifyAllFindings(rawAnalysis.findings, doc);

    // Step 5: Deterministic Risk Scoring (Formula based on verified findings only)
    const { score, riskLevel, status, breakdown, statusMessageTr } = calculateDeterministicScore(
      verifiedFindings,
      rawAnalysis.findings.length,
      doc
    );

    // Step 6: Assemble Complete Analysis Report
    const report: AnalysisReport = {
      documentType: rawAnalysis.documentType,
      status: injectionCheck.detected ? 'security_alert' : status,
      overallRiskScore: score,
      riskLevel,
      summaryTr: statusMessageTr || rawAnalysis.summaryTr,
      verifiedFindings,
      rejectedFindings,
      scoreBreakdown: breakdown,
      limitationsTr: rawAnalysis.limitationsTr,
      needsHumanReview: rawAnalysis.needsHumanReview,
      promptInjectionDetected: injectionCheck.detected || rawAnalysis.promptInjectionDetected,
      promptInjectionWarnings: injectionCheck.warningsTr,
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

    console.log(`[ContractLens Backend] Analysis complete for ${doc.domain}: Score=${score}/100, Verified=${verifiedFindings.length}, Rejected=${rejectedFindings.length}`);
    return res.json(report);
  } catch (error: any) {
    console.error('[ContractLens Backend Error]', error?.message || error);
    return res.status(500).json({
      error: 'Analiz sırasında sunucu hatası oluştu.',
      details: error?.message || 'Bilinmeyen hata',
    });
  }
});

// Run server if launched directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`[ContractLens Backend] Server running at http://localhost:${PORT}`);
    console.log(`[ContractLens Backend] Active LLM Provider: ${config.LLM_PROVIDER}`);
  });
}

export default app;
