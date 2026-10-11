import { LLMAnalysisResponse, LLMAnalysisResponseSchema, LLMFinding, DocumentType } from '../../lib/schema';
import { getSystemPrompt, buildUserPrompt, detectPromptInjection } from '../../lib/security';
import { BackendConfig } from '../config';

export interface LLMProvider {
  name: string;
  analyzeContract(
    documentText: string,
    metadata: { url: string; domain: string; docType: DocumentType; title: string }
  ): Promise<LLMAnalysisResponse>;
}

/**
 * Intelligent Mock Provider for local development, offline demos, and deterministic tests.
 * Extracts actual verbatim sentences matching risk categories from the input text
 * to guarantee 100% grounded quotations without calling external APIs.
 */
export class MockProvider implements LLMProvider {
  public name = 'Mock & Deterministic Demo Provider';

  public async analyzeContract(
    documentText: string,
    metadata: { url: string; domain: string; docType: DocumentType; title: string }
  ): Promise<LLMAnalysisResponse> {
    const injection = detectPromptInjection(documentText);
    const sentences = documentText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 25);

    const findings: LLMFinding[] = [];

    // Search for data sharing clauses
    const dataSharingSentence = sentences.find(s =>
      /share|disclose|third[\s-]part|partners|affiliates|paylaş|üçüncü\s*taraf/i.test(s)
    );
    if (dataSharingSentence) {
      findings.push({
        id: 'finding-mock-01',
        category: 'data_sharing',
        severity: 'high',
        titleTr: 'Kişisel Verilerin Üçüncü Taraflarla Paylaşımı',
        originalQuote: dataSharingSentence.slice(0, 500),
        explanationTr: 'Bu hüküm, kişisel verilerinizin iş ortakları veya belirtilen üçüncü taraflarla paylaşılmasına geniş bir yetki tanımaktadır.',
        potentialImpactTr: 'Verilerinizin hangi taraflarca işleneceğini ve saklanacağını tam olarak denetlemek zorlaşabilir.',
        sourceSection: 'Veri Paylaşımı / Üçüncü Taraflar',
        confidence: 0.94,
        uncertaintyTr: null,
      });
    }

    // Search for unilateral modification clauses
    const unilateralSentence = sentences.find(s =>
      /modify|change|update|discretion|sole\s*discretion|without\s*notice|değiştirme|tek\s*taraflı/i.test(s)
    );
    if (unilateralSentence) {
      findings.push({
        id: 'finding-mock-02',
        category: 'unilateral_changes',
        severity: 'high',
        titleTr: 'Koşullarda Tek Taraflı Değişiklik Hakkı',
        originalQuote: unilateralSentence.slice(0, 500),
        explanationTr: 'Hizmet sağlayıcı, sözleşme veya hizmet şartlarını kullanıcıya önceden bildirim yapmaksızın tek taraflı güncelleme hakkını saklı tutmaktadır.',
        potentialImpactTr: 'Haklarınız ve kullanım şartlarınız haberiniz olmadan aleyhinize değişebilir.',
        sourceSection: 'Şartlarda Değişiklik',
        confidence: 0.91,
        uncertaintyTr: null,
      });
    }

    // Search for auto-renewal / subscription billing
    const autoRenewalSentence = sentences.find(s =>
      /auto-renew|automatic\s*renewal|recurring|cancel\s*before|yenileme|otomatik\s*uzama/i.test(s)
    );
    if (autoRenewalSentence) {
      findings.push({
        id: 'finding-mock-03',
        category: 'auto_renewal_billing',
        severity: 'critical',
        titleTr: 'Otomatik Abonelik Yenileme ve Tahsilat',
        originalQuote: autoRenewalSentence.slice(0, 500),
        explanationTr: 'Abonelik dönem sonunda otomatik olarak yenilenir ve iptal edilmediği sürece ücret kartınızdan tahsil edilmeye devam eder.',
        potentialImpactTr: 'Belirlenen süreden önce iptal etmezseniz onayınız olmadan yeni dönem ücreti kesilebilir.',
        sourceSection: 'Abonelik ve Yenileme',
        confidence: 0.96,
        uncertaintyTr: null,
      });
    }

    // Search for limitation of liability
    const liabilitySentence = sentences.find(s =>
      /limitation\s*of\s*liability|as\s*is|no\s*warranty|sorumluluk|zararlardan\s*sorumlu\s*değildir/i.test(s)
    );
    if (liabilitySentence) {
      findings.push({
        id: 'finding-mock-04',
        category: 'liability_limitation',
        severity: 'moderate',
        titleTr: 'Geniş Sorumluluk Sınırlandırması',
        originalQuote: liabilitySentence.slice(0, 500),
        explanationTr: 'Hizmet sağlayıcı olası veri kayıpları veya dolaylı zararlar için yasal olarak sorumluluk kabul etmediğini beyan etmektedir.',
        potentialImpactTr: 'Hizmet kaynaklı bir problemde maddi zararınızı tazmin etmeniz güçleşebilir.',
        sourceSection: 'Sorumluluğun Sınırlandırılması',
        confidence: 0.88,
        uncertaintyTr: null,
      });
    }

    // Search for arbitration or class action waiver
    const arbitrationSentence = sentences.find(s =>
      /arbitration|class\s*action\s*waiver|dispute|tahkim|toplu\s*dava\s*feragati/i.test(s)
    );
    if (arbitrationSentence) {
      findings.push({
        id: 'finding-mock-05',
        category: 'arbitration_dispute',
        severity: 'high',
        titleTr: 'Zorunlu Tahkim ve Toplu Dava Hakkından Feragat',
        originalQuote: arbitrationSentence.slice(0, 500),
        explanationTr: 'Uyuşmazlıkların mahkeme yerine özel tahkim yoluyla çözüleceği ve toplu dava açma hakkından feragat edildiği belirtilmektedir.',
        potentialImpactTr: 'Yasal mahkemelere başvurma ve hak arama imkanınız kısıtlanabilir.',
        sourceSection: 'Uyuşmazlık Çözümü',
        confidence: 0.93,
        uncertaintyTr: null,
      });
    }

    // If no specific risk sentence matched, take the first valid sentence
    if (findings.length === 0 && sentences.length > 0) {
      findings.push({
        id: 'finding-mock-generic',
        category: 'other',
        severity: 'low',
        titleTr: 'Standart Hizmet ve Kullanım Kaydı',
        originalQuote: sentences[0].slice(0, 300),
        explanationTr: 'İncelenen belgede standart kullanım şartlarına ilişkin genel kayıtlar bulunmaktadır.',
        potentialImpactTr: 'Belirgin bir yüksek risk tespit edilmedi.',
        sourceSection: 'Genel Şartlar',
        confidence: 0.75,
        uncertaintyTr: 'Metinde kritik bir kısıtlamaya rastlanmadı.',
      });
    }

    return {
      documentType: metadata.docType,
      rawRiskScore: Math.min(95, findings.length * 20),
      rawRiskLevel: findings.length >= 3 ? 'high' : findings.length >= 2 ? 'moderate' : 'low',
      summaryTr: `Sözleşme analizi tamamlandı. Belgede ${findings.length} adet dikkat çekici hukuki madde tespit edildi.`,
      findings,
      limitationsTr: [
        'Yerel demo ve test ortamında doğrulanmış alıntılar üzerinden analiz oluşturuldu.',
        'Önemli kararlar için sözleşmenin tamamı hukuki uzmanla değerlendirilmelidir.',
      ],
      needsHumanReview: true,
      promptInjectionDetected: injection.detected,
    };
  }
}

/**
 * OpenAI Production Provider using GPT-4o / GPT-4o-mini with structured JSON output.
 */
export class OpenAIProvider implements LLMProvider {
  public name = 'OpenAI Provider';
  private config: BackendConfig;

  constructor(config: BackendConfig) {
    this.config = config;
  }

  public async analyzeContract(
    documentText: string,
    metadata: { url: string; domain: string; docType: DocumentType; title: string }
  ): Promise<LLMAnalysisResponse> {
    const apiKey = this.config.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY yapılandırılmamış.');
    }

    const systemPrompt = getSystemPrompt();
    const userPrompt = buildUserPrompt(documentText, metadata);

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT_MS);

        const response = await fetch(`${this.config.OPENAI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.OPENAI_MODEL,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenAI API hatası [${response.status}]: ${errText.slice(0, 200)}`);
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) {
          throw new Error('OpenAI boş yanıt döndürdü.');
        }

        const parsedJson = JSON.parse(rawContent);
        return LLMAnalysisResponseSchema.parse(parsedJson);
      } catch (err: any) {
        lastError = err;
        if (attempt < this.config.MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error('OpenAI istekleri başarısız oldu.');
  }
}

/**
 * Factory for creating the configured LLM provider.
 */
export function createLLMProvider(config: BackendConfig): LLMProvider {
  switch (config.LLM_PROVIDER) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'mock':
    default:
      return new MockProvider();
  }
}
