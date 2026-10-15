describe('ContractLens Production Quality Demo Walkthrough', () => {
  it('Comprehensive User Journey & Risk Analysis Walkthrough (40-60s)', () => {
    // -------------------------------------------------------------------------
    // 1. Normal contract page opening and automatic document detection
    // -------------------------------------------------------------------------
    cy.visit('/popup.html?fixture=privacy_policy.html');

    // Extension detects the document type, target domain, and readiness
    cy.contains('ContractLens').should('be.visible');
    cy.contains('acmecloud.example.com').should('be.visible');
    cy.contains('Gizlilik Politikası').should('be.visible');
    cy.contains('Sayfa Analize Hazır').should('be.visible');

    // Pause for viewer to comfortably read detected metadata and notice extension status
    cy.wait(1500);

    // -------------------------------------------------------------------------
    // 2. Click "Sayfayı Analiz Et" and observe multi-step loading progression
    // -------------------------------------------------------------------------
    cy.get('#btn-analyze-page').should('be.visible').click();

    // The loading sequence displays live status updates:
    // - Sayfa DOM yapısı ve hukuki bölümler taranıyor...
    // - Alibaba Page Agent yapısal analizi uygulanıyor...
    // - Bulgular doğrulanıyor ve risk puanı hesaplanıyor...
    cy.wait(1500);

    // -------------------------------------------------------------------------
    // 3. Risk report arrival, inspection of verified clauses, exact quote & Turkish explanation
    // -------------------------------------------------------------------------
    cy.contains(/Risk Değerlendirmesi/i, { timeout: 8000 }).should('be.visible');
    cy.contains(/Doğrulandı/i).should('be.visible');
    cy.contains('Kişisel Verilerin Üçüncü Taraflarla Paylaşımı').should('be.visible');

    // Pause to let viewer absorb the overall risk score and verified count
    cy.wait(1500);

    // Expand the first risky clause to inspect verbatim quotation and Turkish explanation
    cy.contains('Kişisel Verilerin Üçüncü Taraflarla Paylaşımı').click();

    cy.contains('Orijinal Alıntı').should('be.visible');
    cy.contains('Kullanıcıya Etkisi').should('be.visible');
    cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');

    // Give viewer ample time (8 seconds) to read the exact quotation and plain Turkish explanation
    cy.wait(3000);

    // Expand the second finding (Unilateral Modifications) to show broad risk coverage
    cy.contains('Koşullarda Tek Taraflı Değişiklik Hakkı').should('be.visible').click();
    cy.wait(1500);

    // -------------------------------------------------------------------------
    // 4. Incomplete/short text document: Honest guardrail "Yetersiz Veri / Analiz Belirsiz"
    // -------------------------------------------------------------------------
    cy.visit('/popup.html?fixture=insufficient_data.html');

    // Document detection confirms short legal notice
    cy.contains('Genel Hukuki / Standart Metin').should('be.visible');
    cy.wait(3000);

    // Initiate analysis
    cy.get('#btn-analyze-page').should('be.visible').click();
    cy.wait(3000);

    // System honestly warns about insufficient text instead of inventing fake 0-risk score
    cy.contains(/Yetersiz Veri \/ Analiz Belirsiz/i, { timeout: 8000 }).should('be.visible');
    cy.contains(/asgari 200 kelime gereklidir/i).should('be.visible');

    // Allow viewer to absorb the honest guardrail behavior
    cy.wait(2000);

    // -------------------------------------------------------------------------
    // 5. Prompt injection resistance: Malicious directives ignored & security warning banner
    // -------------------------------------------------------------------------
    cy.visit('/popup.html?fixture=prompt_injection.html');

    // Detected document
    cy.contains('Kullanım Koşulları').should('be.visible');
    cy.wait(3000);

    // Initiate analysis on malicious document
    cy.get('#btn-analyze-page').should('be.visible').click();
    cy.wait(3000);

    // Assert that prompt injection attempts were intercepted and neutralized
    cy.contains(/Güvenlik Uyarısı \(Prompt Injection\)/i, { timeout: 8000 }).should('be.visible');
    cy.contains(/yok sayıldı/i).should('be.visible');

    // Allow viewer to review security defense banner
    cy.wait(7000);

    // -------------------------------------------------------------------------
    // 6. Sidepanel comprehensive inspection (Closing Overview)
    // -------------------------------------------------------------------------
    cy.visit('/sidepanel.html');
    cy.contains('ContractLens').should('be.visible');
    cy.contains('Detaylı Rapor').should('be.visible');
    cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
    cy.wait(4500);
  });
});
