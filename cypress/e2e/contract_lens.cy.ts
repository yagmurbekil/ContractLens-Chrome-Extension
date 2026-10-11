describe('ContractLens End-to-End User Journey', () => {
  beforeEach(() => {
    // Set viewport for clean video capture
    cy.viewport(1280, 720);
  });

  it('Step 1 & 2: Opens privacy policy, detects document type, runs analysis, and shows verified risk clauses', () => {
    // Open demo harness with privacy policy fixture
    cy.visit('/demo.html?fixture=privacy_policy.html');
    cy.wait(800);

    // Verify fixture document loaded
    cy.get('#fixture-frame').should('exist');

    // Access popup inside right-panel iframe
    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        // Assert ContractLens header and detected document badge
        cy.contains('ContractLens').should('be.visible');
        cy.contains('Gizlilik Politikası').should('be.visible');

        // Click "Sayfayı Analiz Et"
        cy.get('#btn-analyze-page').click();
      });
    });

    // Wait for analysis to complete and assert verified results
    cy.wait(2000);
    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        // Assert risk score and level
        cy.contains(/Risk Değerlendirmesi/i).should('be.visible');
        cy.contains(/Doğrulandı/i).should('be.visible');
        cy.contains('Kişisel Verilerin Üçüncü Taraflarla Paylaşımı').should('be.visible');
      });
    });
  });

  it('Step 3: Expands verified finding to inspect exact quotation and plain Turkish explanation', () => {
    cy.visit('/demo.html?fixture=privacy_policy.html');
    cy.wait(500);

    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        cy.get('#btn-analyze-page').click();
      });
    });

    cy.wait(2000);
    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        // Click to expand finding
        cy.contains('Kişisel Verilerin Üçüncü Taraflarla Paylaşımı').click();
        cy.wait(500);

        // Assert Turkish explanation and original quote are displayed
        cy.contains('Orijinal Alıntı').should('be.visible');
        cy.contains('Kullanıcıya Etkisi').should('be.visible');
        cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
      });
    });
  });

  it('Step 4: Encounters insufficient or incomplete text and honestly displays uncertainty instead of fake score', () => {
    // Visit insufficient data fixture
    cy.visit('/demo.html?fixture=insufficient_data.html');
    cy.wait(800);

    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        cy.get('#btn-analyze-page').click();
      });
    });

    cy.wait(1500);
    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        // Must honestly display Insufficient Data banner, NOT a false 0-risk score!
        cy.contains(/Yetersiz Veri \/ Analiz Belirsiz/i).should('be.visible');
      });
    });
  });

  it('Step 5: Demonstrates prompt injection resistance - malicious instructions ignored and warning displayed', () => {
    // Visit prompt injection attack fixture
    cy.visit('/demo.html?fixture=prompt_injection.html');
    cy.wait(800);

    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        cy.get('#btn-analyze-page').click();
      });
    });

    cy.wait(1500);
    cy.get('.right-panel iframe').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).within(() => {
        // Assert that security warning banner is displayed
        cy.contains(/Güvenlik Uyarısı \(Prompt Injection\)/i).should('be.visible');
        // Assert disclaimer is still persistent
        cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
      });
    });
  });

  it('Full Sidepanel Report Inspection', () => {
    cy.visit('/sidepanel.html');
    cy.wait(1000);
    cy.contains('ContractLens').should('be.visible');
    cy.contains('Detaylı Rapor').should('be.visible');
    cy.contains('ContractLens hukuki tavsiye vermez').should('be.visible');
  });
});
