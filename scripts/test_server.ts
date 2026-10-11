import express from 'express';
import path from 'node:path';

const app = express();
const PORT = 3002;

// Serve Cypress fixtures
app.use('/fixtures', express.static(path.resolve('cypress/fixtures')));

// Serve extension build artifacts
app.use(express.static(path.resolve('dist')));

// Interactive Demo harness page (splits screen: fixture document on left, ContractLens extension on right)
app.get('/demo.html', (req, res) => {
  const fixture = req.query.fixture || 'privacy_policy.html';
  res.send(`<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>ContractLens Production Demo Harness</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #020617; color: #f8fafc; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
    header { background: #0f172a; border-bottom: 1px solid #1e293b; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
    .title { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; }
    .badge { background: #4f46e5; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
    .selector { display: flex; align-items: center; gap: 10px; font-size: 12px; }
    select { background: #1e293b; color: white; border: 1px solid #334155; padding: 4px 10px; border-radius: 6px; }
    .container { display: flex; flex: 1; overflow: hidden; }
    .left-panel { flex: 1; border-right: 1px solid #1e293b; display: flex; flex-direction: column; background: white; }
    .right-panel { width: 420px; background: #020617; display: flex; flex-direction: column; align-items: center; padding: 20px 10px; overflow-y: auto; }
    iframe { width: 100%; height: 100%; border: none; }
    .browser-bar { background: #e2e8f0; color: #475569; padding: 6px 12px; font-size: 11px; font-family: monospace; border-bottom: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  <header>
    <div class="title">
      <span>ContractLens</span>
      <span class="badge">E2E Canlı Test & Demo Paneli</span>
    </div>
    <div class="selector">
      <span>Test Senaryosu:</span>
      <select id="fixture-select" onchange="window.location.search = '?fixture=' + this.value">
        <option value="privacy_policy.html" ${fixture === 'privacy_policy.html' ? 'selected' : ''}>1. Gizlilik Politikası (Veri Paylaşımı Riski)</option>
        <option value="subscription_terms.html" ${fixture === 'subscription_terms.html' ? 'selected' : ''}>2. Abonelik Koşulları (Otomatik Yenileme)</option>
        <option value="clean_terms.html" ${fixture === 'clean_terms.html' ? 'selected' : ''}>3. Düşük Riskli Standart Metin</option>
        <option value="insufficient_data.html" ${fixture === 'insufficient_data.html' ? 'selected' : ''}>4. Yetersiz / Belirsiz Veri Senaryosu</option>
        <option value="prompt_injection.html" ${fixture === 'prompt_injection.html' ? 'selected' : ''}>5. Prompt Injection Saldırı Sayfası</option>
      </select>
    </div>
  </header>
  <div class="container">
    <div class="left-panel">
      <div class="browser-bar">🌐 https://acmecloud.example.com/legal/${fixture}</div>
      <iframe id="fixture-frame" src="/fixtures/${fixture}"></iframe>
    </div>
    <div class="right-panel">
      <iframe src="/popup.html" style="width: 380px; height: 560px; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);"></iframe>
    </div>
  </div>
</body>
</html>`);
});

app.listen(PORT, () => {
  console.log(`[ContractLens Test Server] Running at http://localhost:${PORT}`);
  console.log(`[ContractLens Test Server] Demo Harness: http://localhost:${PORT}/demo.html`);
  console.log(`[ContractLens Test Server] Popup UI: http://localhost:${PORT}/popup.html`);
  console.log(`[ContractLens Test Server] Sidepanel UI: http://localhost:${PORT}/sidepanel.html`);
});
