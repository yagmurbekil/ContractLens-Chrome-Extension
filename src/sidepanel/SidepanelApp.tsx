import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Filter,
  Download,
  ExternalLink,
  Info
} from 'lucide-react';
import { AnalysisReport, FindingCategory, FindingSeverity } from '../lib/types';

const CATEGORY_NAMES_TR: Record<FindingCategory, string> = {
  data_sharing: 'Veri Paylaşımı ve Üçüncü Taraflar',
  unilateral_changes: 'Tek Taraflı Değişiklik Hakları',
  liability_limitation: 'Sorumluluk Sınırlandırmaları',
  arbitration_dispute: 'Tahkim ve Uyuşmazlık Çözümü',
  auto_renewal_billing: 'Otomatik Yenileme ve Ücretlendirme',
  tracking_cookies: 'Takip ve Çerezler',
  data_retention: 'Veri Saklama Süreleri',
  termination_suspension: 'Hesap Kapatma ve Fesih',
  content_rights: 'İçerik Hakları ve Lisanslama',
  other: 'Diğer Hükümler',
};

const SEVERITY_COLORS: Record<FindingSeverity, { label: string; badge: string; border: string }> = {
  critical: { label: 'Kritik', badge: 'bg-purple-950 text-purple-300 border-purple-800', border: 'border-l-purple-500' },
  high: { label: 'Yüksek', badge: 'bg-rose-950 text-rose-300 border-rose-800', border: 'border-l-rose-500' },
  moderate: { label: 'Orta', badge: 'bg-amber-950 text-amber-300 border-amber-800', border: 'border-l-amber-500' },
  low: { label: 'Düşük', badge: 'bg-slate-800 text-slate-300 border-slate-700', border: 'border-l-slate-400' },
};

export const SidepanelApp: React.FC = () => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'verified' | 'unverified' | 'breakdown'>('verified');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GET_LAST_REPORT' }, (response) => {
        if (response?.payload) {
          setReport(response.payload);
        }
      });
    }
  };

  const handleCopyReport = () => {
    if (!report) return;

    const markdown = `# ContractLens Risk Raporu: ${report.documentMetadata.domain}
Tarih: ${report.documentMetadata.analyzedAt}
Belge Türü: ${report.documentType}
Genel Risk Puanı: ${report.overallRiskScore} / 100 (${report.riskLevel.toUpperCase()})

## Özet
${report.summaryTr}

## Doğrulanmış Risk Maddeleri (${report.verifiedFindings.length})
${report.verifiedFindings
  .map(
    (f, i) => `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.titleTr}
- **Kategori:** ${CATEGORY_NAMES_TR[f.category] || f.category}
- **Orijinal Alıntı:** "${f.originalQuote}"
- **Açıklama:** ${f.explanationTr}
- **Kullanıcıya Etkisi:** ${f.potentialImpactTr}
- **Bölüm:** ${f.sourceSection}
- **Doğrulama Durumu:** ${f.verificationDetails}
`
  )
  .join('\n')}

---
*Yasal Uyarı: ContractLens hukuki tavsiye vermez. Analiz otomatik yapılmıştır.*`;

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFindings = report
    ? report.verifiedFindings.filter((f) =>
        selectedSeverity === 'all' ? true : f.severity === selectedSeverity
      )
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans p-4 max-w-4xl mx-auto">
      {/* Top Bar */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-wide flex items-center gap-2">
              ContractLens
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Detaylı Rapor</span>
            </h1>
            <p className="text-xs text-slate-400">Doğrulanmış Hukuki Risk Analiz Dosyası</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            disabled={!report}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Kopyalandı' : 'Raporu Kopyala'}</span>
          </button>
          <button
            onClick={loadReport}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 transition"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {!report ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-12 h-12 text-slate-700 mb-3" />
          <h2 className="text-sm font-medium text-slate-300">Henüz Analiz Yapılmadı</h2>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Uzantı simgesine tıklayıp açık olan yasal sayfada "Sayfayı Analiz Et" butonuna basarak ilk raporunuzu oluşturun.
          </p>
        </div>
      ) : (
        <main className="flex-1 space-y-4 pt-4">
          {/* Metadata Card */}
          <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <div className="text-slate-400">İncelenen Alan Adı</div>
              <div className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{report.documentMetadata.domain}</span>
              </div>
            </div>
            <div>
              <div className="text-slate-400">Belge Türü</div>
              <div className="font-medium text-indigo-300 mt-0.5">{report.documentType}</div>
            </div>
            <div>
              <div className="text-slate-400">Kelime Sayısı</div>
              <div className="font-mono text-slate-200 mt-0.5">{report.documentMetadata.wordCount} kelime</div>
            </div>
            <div>
              <div className="text-slate-400">Çıkarma Yöntemi</div>
              <div className="font-mono text-slate-300 mt-0.5">{report.documentMetadata.extractionMethod}</div>
            </div>
          </div>

          {/* Security Alert if injection detected */}
          {report.promptInjectionDetected && (
            <div className="bg-amber-950/60 border border-amber-600 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-300">Prompt Injection Tehdidi Engellendi</h4>
                <p className="mt-1 text-slate-300 leading-relaxed">
                  Web sayfası kaynak kodunda veya metninde yapay zekayı kandırmaya yönelik yönergeler tespit edildi. ContractLens güvenlik katmanı sayesinde sayfa talimatları dikkate alınmamış ve sistem sırları korunmuştur.
                </p>
                {report.promptInjectionWarnings.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-amber-200/90">
                    {report.promptInjectionWarnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Score & Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Deterministik Risk Skoru</span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-extrabold font-mono text-slate-100">{report.overallRiskScore}</span>
                  <span className="text-slate-400 text-sm font-mono">/ 100</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Risk Seviyesi:</span>
                <span className={`font-semibold uppercase px-2 py-0.5 rounded text-[11px] font-mono ${
                  report.riskLevel === 'critical' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                  report.riskLevel === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                  report.riskLevel === 'moderate' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                  'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {report.riskLevel}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Analiz Özeti</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {report.summaryTr}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{report.verifiedFindings.length} doğrulanmış risk</span>
                <span>{report.rejectedFindings.length} elenen/doğrulanamayan alıntı</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pt-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('verified')}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'verified'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Doğrulanmış Bulgular ({report.verifiedFindings.length})
              </button>
              <button
                onClick={() => setActiveTab('unverified')}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'unverified'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Elenen / Kanıtsız Maddeler ({report.rejectedFindings.length})
              </button>
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`pb-2 px-3 text-xs font-medium border-b-2 transition ${
                  activeTab === 'breakdown'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Puanlama Formülü ve Kırılım
              </button>
            </div>

            {activeTab === 'verified' && (
              <div className="flex items-center gap-1 pb-2">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">Tüm Seviyeler</option>
                  <option value="critical">Kritik</option>
                  <option value="high">Yüksek</option>
                  <option value="moderate">Orta</option>
                  <option value="low">Düşük</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 1: Verified Findings */}
          {activeTab === 'verified' && (
            <div className="space-y-3">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                  Seçili filtreye uygun doğrulanmış risk maddesi bulunamadı.
                </div>
              ) : (
                filteredFindings.map((finding) => {
                  const sev = SEVERITY_COLORS[finding.severity];
                  return (
                    <article
                      key={finding.id}
                      className={`bg-slate-900/80 rounded-xl border border-slate-800 p-4 border-l-4 ${sev.border} space-y-2.5 transition hover:border-slate-700`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded border ${sev.badge}`}>
                            {sev.label}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {CATEGORY_NAMES_TR[finding.category] || finding.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Metinde Doğrulandı</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-100">{finding.titleTr}</h3>

                      <p className="text-xs text-slate-300 leading-relaxed">{finding.explanationTr}</p>

                      {/* Verbatim Quotation Box */}
                      <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs text-slate-300 font-mono">
                        <div className="text-[10px] text-slate-500 font-sans uppercase font-semibold mb-1 flex items-center justify-between">
                          <span>Orijinal Belge Alıntısı ({finding.sourceSection})</span>
                          <span>Konum: {finding.matchedOffsets ? `${finding.matchedOffsets.start}-${finding.matchedOffsets.end}` : 'Eşleşti'}</span>
                        </div>
                        <blockquote className="border-l-2 border-indigo-500 pl-2 italic text-slate-300 text-[11px]">
                          "{finding.originalQuote}"
                        </blockquote>
                      </div>

                      <div className="text-xs text-slate-400 pt-1">
                        <strong className="text-slate-300">Potansiyel Kullanıcı Etkisi:</strong> {finding.potentialImpactTr}
                      </div>

                      {finding.uncertaintyTr && (
                        <div className="text-[11px] text-amber-300/80 bg-amber-950/20 p-2 rounded border border-amber-900/40">
                          <strong>Belirsizlik Notu:</strong> {finding.uncertaintyTr}
                        </div>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Rejected / Unverified Findings */}
          {activeTab === 'unverified' && (
            <div className="space-y-3">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-200">Deterministik Doğrulama Koruması:</strong> Aşağıdaki maddeler, orijinal metinde birebir karşılığı bulunamadığı veya alıntı doğrulanamadığı için sistem tarafından otomatik olarak <strong>reddedilmiş</strong> ve genel risk puanına yansıtılmamıştır.
              </div>

              {report.rejectedFindings.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
                  Reddedilen veya alıntısı doğrulanamayan madde bulunmuyor. Tüm çıkarımlar güvenle eşleşti.
                </div>
              ) : (
                report.rejectedFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 border-l-4 border-l-slate-600 opacity-80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">{finding.titleTr}</span>
                      <span className="text-[11px] text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Doğrulanamadı
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 italic">"{finding.originalQuote}"</div>
                    <div className="text-[11px] text-rose-300 font-mono">
                      Gerekçe: {finding.verificationDetails}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Scoring Formula & Transparency */}
          {activeTab === 'breakdown' && (
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Deterministik Puanlama Matematik Modeli</h3>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  ContractLens yapay zekanın keyfi bir puan belirlemesine izin vermez. Risk skoru, yalnızca metinde bağımsız olarak doğrulanan bulguların ciddiyet dereceleri ve kategori azalan getiri katsayısı kullanılarak hesaplanır.
                </p>
              </div>

              <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 font-mono text-[11px] space-y-1 text-indigo-300">
                <div>Kritik Madde Ağırlığı: 30 Puan</div>
                <div>Yüksek Risk Madde Ağırlığı: 20 Puan</div>
                <div>Orta Risk Madde Ağırlığı: 10 Puan</div>
                <div>Düşük Risk Madde Ağırlığı: 5 Puan</div>
                <div className="text-slate-400 pt-1">Kategori Başına Azalan Çarpan: 1. Madde %100, 2. Madde %50, 3.+ Madde %25</div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-2">Kategori Bazlı Katkı Kırılımı:</h4>
                <div className="space-y-1.5">
                  {report.scoreBreakdown.categoryDetails.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <div>
                        <span className="text-slate-200 font-medium">{CATEGORY_NAMES_TR[cat.category] || cat.category}</span>
                        <span className="text-slate-500 text-[11px] ml-2 font-mono">({cat.findingCount} madde, En yüksek: {cat.highestSeverity})</span>
                      </div>
                      <span className="font-mono text-indigo-300 font-semibold">+{cat.subtotalScore} Puan</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-slate-200">Hesaplanan Nihai Skor:</span>
                <span className="text-indigo-400 font-mono">{report.scoreBreakdown.finalScore} / 100</span>
              </div>
            </div>
          )}

          {/* Limitations */}
          {report.limitationsTr && report.limitationsTr.length > 0 && (
            <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Analiz Sınırları ve İpuçları</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {report.limitationsTr.map((lim, i) => (
                  <li key={i}>{lim}</li>
                ))}
              </ul>
            </div>
          )}
        </main>
      )}

      {/* Persistent Legal Disclaimer */}
      <footer className="mt-8 pt-4 border-t border-slate-800 text-center">
        <p className="text-[11px] leading-relaxed text-slate-500 max-w-2xl mx-auto">
          ContractLens hukuki tavsiye vermez. Analiz, otomatik metin değerlendirmesine dayanır ve hata içerebilir. Önemli kararlar için orijinal sözleşmeyi inceleyin ve gerektiğinde bir hukuk uzmanına danışın.
        </p>
      </footer>
    </div>
  );
};
