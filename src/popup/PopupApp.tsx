import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, RefreshCw, FileText, CheckCircle2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { AnalysisReport, DocumentType } from '../lib/types';

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  terms_of_service: 'Kullanım Koşulları (Terms of Service)',
  privacy_policy: 'Gizlilik Politikası (Privacy Policy)',
  subscription_terms: 'Abonelik ve İptal Şartları',
  cookie_policy: 'Çerez Politikası',
  refund_terms: 'İade ve Cayma Şartları',
  data_processing_agreement: 'Veri İşleme Sözleşmesi (DPA)',
  other: 'Genel Hukuki / Standart Metin',
};

const RISK_LEVEL_CONFIG = {
  low: { label: 'Düşük Risk', color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-800/60' },
  moderate: { label: 'Orta Risk', color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-800/60' },
  high: { label: 'Yüksek Risk', color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-800/60' },
  critical: { label: 'Kritik Risk', color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-800/60' },
};

export const PopupApp: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [detectedType, setDetectedType] = useState<DocumentType>('terms_of_service');
  const [domain, setDomain] = useState<string>('ornek-site.com');
  const [pageTitle, setPageTitle] = useState<string>('Sayfa');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedFindingId, setExpandedFindingId] = useState<string | null>(null);
  const [forceDemo, setForceDemo] = useState<boolean>(false);

  useEffect(() => {
    // Detect page on popup open
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'DETECT_PAGE' }, (response) => {
        if (response?.payload) {
          setDetectedType(response.payload.docType || 'other');
          setDomain(response.payload.domain || window.location.hostname);
          setPageTitle(response.payload.title || 'Sayfa');
        }
      });

      // Check for cached report
      chrome.runtime.sendMessage({ type: 'GET_LAST_REPORT' }, (response) => {
        if (response?.payload) {
          setReport(response.payload);
        }
      });
    }
  }, []);

  const handleAnalyze = () => {
    setLoading(true);
    setError(null);
    setLoadingStep('Sayfa DOM yapısı ve hukuki bölümler taranıyor...');

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      setTimeout(() => setLoadingStep('Alibaba Page Agent yapısal analizi uygulanıyor...'), 600);
      setTimeout(() => setLoadingStep('Bulgular doğrulanıyor ve risk puanı hesaplanıyor...'), 1200);

      chrome.runtime.sendMessage(
        { type: 'ANALYZE_PAGE', payload: { forceDemo } },
        (response) => {
          setLoading(false);
          if (response?.type === 'ANALYZE_PAGE_SUCCESS') {
            setReport(response.payload);
          } else {
            setError(response?.payload?.message || 'Analiz tamamlanamadı.');
          }
        }
      );
    } else {
      // Direct browser fallback (for testing/demo outside extension)
      setTimeout(() => {
        setLoading(false);
        setError('Uzantı çalışma ortamı bulunamadı (Yerel test modu).');
      }, 1000);
    }
  };

  const openSidepanel = () => {
    if (typeof chrome !== 'undefined' && chrome.sidePanel?.open) {
      chrome.windows.getCurrent((w) => {
        if (w.id) chrome.sidePanel.open({ windowId: w.id });
      });
    } else {
      window.open('sidepanel.html', '_blank');
    }
  };

  const riskInfo = report ? RISK_LEVEL_CONFIG[report.riskLevel] : null;

  return (
    <div className="w-[380px] min-h-[520px] bg-slate-950 text-slate-100 p-4 flex flex-col font-sans select-none border border-slate-800">
      {/* Header */}
      <header className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-slate-800 flex items-center justify-center shadow-inner border border-indigo-400/30">
            <Shield className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-slate-100 flex items-center gap-1">
              ContractLens
              <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-slate-800 text-slate-400 rounded">v1.0</span>
            </h1>
            <p className="text-[11px] text-slate-400">Hukuki Sözleşme ve Risk Analizi</p>
          </div>
        </div>

        <button
          onClick={openSidepanel}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          title="Genişletilmiş Raporu Aç"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Genişlet</span>
        </button>
      </header>

      {/* Target Page Info */}
      <div className="bg-slate-900/90 rounded-lg p-2.5 mb-3 border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="flex items-center gap-1 truncate max-w-[200px]" title={domain}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            {domain}
          </span>
          <span className="text-[10px] text-slate-500 uppercase font-mono">Hedef Belge</span>
        </div>
        <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{DOCUMENT_TYPE_LABELS[detectedType] || detectedType}</span>
        </div>
      </div>

      {/* Main Analysis Action */}
      {!report && !loading && (
        <div className="my-auto py-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="px-4">
            <h2 className="text-sm font-medium text-slate-200">Sayfa Analize Hazır</h2>
            <p className="text-xs text-slate-400 mt-1">
              Sözleşme metni taranacak, bağlayıcı şartlar ve gizlilik riskleri doğrulanmış alıntılarla listelenecektir.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={forceDemo}
                onChange={(e) => setForceDemo(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
              />
              <span>Yerel Doğrulanmış Demo Modu</span>
            </label>
          </div>

          <button
            onClick={handleAnalyze}
            id="btn-analyze-page"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-xs rounded-lg transition shadow-md flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sayfayı Analiz Et</span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="my-auto py-8 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-300 font-medium">{loadingStep}</p>
          <p className="text-[11px] text-slate-500">Alibaba Page Agent DOM Landmark extraction aktif...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-lg p-3 my-3 text-xs text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Analiz Hatası</div>
            <div className="mt-0.5 text-slate-300">{error}</div>
            <button
              onClick={handleAnalyze}
              className="mt-2 px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 rounded text-[11px] font-medium text-rose-200 transition"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      )}

      {/* Report Display */}
      {report && !loading && (
        <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
          {/* Prompt Injection Security Warning if detected */}
          {report.promptInjectionDetected && (
            <div className="bg-amber-950/60 border border-amber-600/80 rounded-md p-2 text-[11px] text-amber-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Güvenlik Uyarısı (Prompt Injection):</span> Sayfa metninde yapay zekayı yönlendirmeye çalışan gizli komutlar tespit edildi. Bu komutlar yok sayıldı.
              </div>
            </div>
          )}

          {/* Insufficient Data Guardrail Banner */}
          {report.status === 'insufficient_data' ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-center space-y-1">
              <div className="text-amber-400 font-semibold text-xs flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Yetersiz Veri / Analiz Belirsiz</span>
              </div>
              <p className="text-[11px] text-slate-400">
                {report.summaryTr || 'Belge metni güvenilir analiz için çok kısa. Yanıltıcı düşük risk gösterilmez.'}
              </p>
            </div>
          ) : (
            /* Score Summary Card */
            <div className={`p-3 rounded-lg border ${riskInfo?.bg} ${riskInfo?.border} flex items-center justify-between`}>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Risk Değerlendirmesi</div>
                <div className={`text-base font-bold ${riskInfo?.color} flex items-center gap-1.5 mt-0.5`}>
                  <span>{riskInfo?.label}</span>
                  <span className="text-xs px-1.5 py-0.5 bg-slate-900/80 rounded border border-slate-800 text-slate-200 font-mono">
                    {report.overallRiskScore} / 100
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">Doğrulanmış Madde</div>
                <div className="text-xs font-semibold text-slate-200">
                  {report.verifiedFindings.length} Risk Maddesi
                </div>
              </div>
            </div>
          )}

          {/* Findings List (Top verified findings) */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Tespit Edilen Maddeler</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {report.verifiedFindings.length} onaylı
              </span>
            </div>

            {report.verifiedFindings.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-900/50 rounded border border-slate-800/80">
                Belirgin bir riskli madde tespit edilmedi veya veri yetersiz.
              </div>
            ) : (
              report.verifiedFindings.slice(0, 4).map((finding) => {
                const isExpanded = expandedFindingId === finding.id;
                return (
                  <div
                    key={finding.id}
                    className="bg-slate-900/80 rounded-md border border-slate-800 p-2.5 hover:border-slate-700 transition"
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer gap-2"
                      onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase font-semibold font-mono ${
                            finding.severity === 'critical' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                            finding.severity === 'high' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            finding.severity === 'moderate' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {finding.severity}
                          </span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                          </span>
                        </div>
                        <h4 className="text-xs font-medium text-slate-200">{finding.titleTr}</h4>
                      </div>
                      <button className="text-slate-500 hover:text-slate-300">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[11px] space-y-1.5">
                        <p className="text-slate-300">{finding.explanationTr}</p>
                        <div className="bg-slate-950/80 p-2 rounded border border-slate-800 text-slate-400 font-mono text-[10px]">
                          <div className="text-slate-500 mb-0.5 font-sans font-semibold">Orijinal Alıntı ({finding.sourceSection}):</div>
                          "{finding.originalQuote}"
                        </div>
                        <div className="text-slate-400">
                          <strong className="text-slate-300">Kullanıcıya Etkisi:</strong> {finding.potentialImpactTr}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleAnalyze}
              className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Yeniden Analiz Et</span>
            </button>
            <button
              onClick={openSidepanel}
              id="btn-view-full-report"
              className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded transition flex items-center justify-center gap-1.5 shadow"
            >
              <span>Tüm Raporu Gör</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <footer className="mt-auto pt-2 border-t border-slate-800/80">
        <p className="text-[9.5px] leading-tight text-slate-500 text-center">
          ContractLens hukuki tavsiye vermez. Analiz, otomatik metin değerlendirmesine dayanır ve hata içerebilir. Önemli kararlar için orijinal sözleşmeyi inceleyin ve gerektiğinde bir hukuk uzmanına danışın.
        </p>
      </footer>
    </div>
  );
};
