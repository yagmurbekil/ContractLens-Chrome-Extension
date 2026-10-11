describe('ContractLens End-to-End User Journey', () => {
  beforeEach(() => {
    cy.viewport(400, 600);
  });

  it('Step 1 & 2: Opens privacy policy, detects document type, runs analysis, and shows verified risk clauses', () => {
    cy.visit('/popup.html?fixture=privacy_policy.html');

    // Assert ContractLens header and detected document badge
    cy.contains('ContractLens').should('be.visible');
    cy.contains('Gizlilik Politikası').should('be.visible');
    cy.contains('acmecloud.example.com').should('be.visible');

    // Click "Sayfayı Analiz Et"
    cy.get('#btn-analyze-page').should('be.visible').click();

    // Assert analysis completion and verified findings
    cy.contains(/Risk Değerlendirmesi/i, { timeout: 6000 }).should('be.visible');
    cy.contains(/Doğrulandı/i).should('be.visible');
    cy.contains('Kişisel Verilerin Üçüncü Taraflarla Paylaşımı').should('be.visible');
  });

  it('Step 3: Expands verified finding to inspect exact quotation and plain Turkish explanation', () => {
    cy.visit('/popup.html?fixture=privacy_policy.html');
    cy.get('#btn-analyze-page').click();

    cy.contains('Kişisel Verilerin Üçüncü Taraflarla Paylaşımı', { timeout: 6000 }).should('be.visible').click();

    // Assert Turkish explanation, verbatim quote, and legal disclaimer
    cy.contains('Orijinal Alıntı').should('be.visible');
    cy.contains('Kullanıcıya Etkisi').should('be.visible');
    cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
  });

  it('Step 4: Encounters insufficient or incomplete text and honestly displays uncertainty instead of fake score', () => {
    cy.visit('/popup.html?fixture=insufficient_data.html');
    cy.get('#btn-analyze-page').should('be.visible').click();

    // Must honestly display Insufficient Data banner, NOT a false 0-risk score!
    cy.contains(/Yetersiz Veri \/ Analiz Belirsiz/i, { timeout: 6000 }).should('be.visible');
  });

  it('Step 5: Demonstrates prompt injection resistance - malicious instructions ignored and warning displayed', () => {
    cy.visit('/popup.html?fixture=prompt_injection.html');
    cy.get('#btn-analyze-page').should('be.visible').click();

    // Assert security warning banner is rendered
    cy.contains(/Güvenlik Uyarısı \(Prompt Injection\)/i, { timeout: 6000 }).should('be.visible');
    cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
  });

  it('Full Sidepanel Report Inspection', () => {
    cy.viewport(1024, 768);
    cy.visit('/sidepanel.html');
    cy.contains('ContractLens').should('be.visible');
    cy.contains('Detaylı Rapor').should('be.visible');
    cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
  });
});
