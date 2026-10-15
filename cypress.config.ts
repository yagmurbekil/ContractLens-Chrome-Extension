import { defineConfig } from 'cypress';

export default defineConfig({
  video: true,
  videoCompression: false,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  viewportWidth: 1280,
  viewportHeight: 800,
  e2e: {
    baseUrl: 'http://localhost:3002',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    setupNodeEvents(on, config) {
      // Adjust Chrome window size for higher resolution video
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'chromium') {
          launchOptions.args.push('--window-size=1280,800');
          launchOptions.args.push('--force-device-scale-factor=1');
        }
        return launchOptions;
      });
      return config;
    },
  },
});
