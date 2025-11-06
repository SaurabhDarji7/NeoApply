/**
 * Ashby ATS Content Script
 *
 * Ashby is a modern ATS popular with tech startups and scale-ups.
 * Handles job applications on jobs.ashbyhq.com.
 *
 * Common patterns:
 * - Modern React-based UI
 * - Clean form design
 * - Progressive field revelation
 * - LinkedIn profile integration option
 */

import {
  CommonUtils,
  PanelUI,
  UniversalFormDetector,
  EnhancedFieldMapper,
  AutoFillEngine
} from './common.js';

class AshbyApplicationHandler {
  constructor() {
    this.ATS_TYPE = 'Ashby';
    this.detector = new UniversalFormDetector();
    this.mapper = new EnhancedFieldMapper();
    this.engine = new AutoFillEngine();
    this.panel = null;
    this.currentForm = null;
  }

  /**
   * Ashby-specific selectors
   */
  ASHBY_SELECTORS = {
    form: 'form[class*="ApplicationForm"], div[class*="application"]',
    firstName: 'input[name="firstName"], input[placeholder*="First name"]',
    lastName: 'input[name="lastName"], input[placeholder*="Last name"]',
    email: 'input[name="email"], input[type="email"]',
    phone: 'input[name="phone"], input[type="tel"]',
    linkedin: 'input[name="linkedInUrl"], input[placeholder*="LinkedIn"]',
    github: 'input[name="githubUrl"], input[placeholder*="GitHub"]',
    portfolio: 'input[name="portfolioUrl"], input[placeholder*="website"]',
    resume: 'input[type="file"]'
  };

  /**
   * Initialize Ashby handler
   */
  async init() {
    console.log('[NeoApply Ashby] Initializing...');

    // React app needs time to load
    await CommonUtils.delay(1500);

    await this.detectAndInit();

    // Observe for dynamic content
    this.observePageChanges();

    // Listen for messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });
  }

  /**
   * Detect Ashby form and initialize UI
   */
  async detectAndInit() {
    console.log('[NeoApply Ashby] Detecting application form...');

    // Try Ashby-specific selectors first
    let formContainer = document.querySelector(this.ASHBY_SELECTORS.form);

    // Ashby sometimes uses a div container, not form element
    if (!formContainer) {
      formContainer = document.querySelector('div[class*="Application"]');
    }

    if (!formContainer) {
      // Fallback to generic detection
      const detection = this.detector.detectApplicationForm();
      if (detection) {
        formContainer = detection.form;
      }
    }

    if (!formContainer) {
      console.log('[NeoApply Ashby] No application form detected');
      return;
    }

    this.currentForm = formContainer;
    console.log('[NeoApply Ashby] ✅ Form detected');

    // Ashby typically doesn't use wizards
    const wizardState = { isWizard: false };

    // Inject panel
    await this.injectPanel(wizardState);
  }

  /**
   * Inject autofill panel
   */
  async injectPanel(wizardState) {
    const panelUI = new PanelUI({
      atsType: this.ATS_TYPE,
      wizardState
    });

    await panelUI.inject();
    this.panel = panelUI.panel;

    // Attach autofill handler
    const autofillBtn = this.panel.querySelector('#neoapply-autofill-btn');
    autofillBtn?.addEventListener('click', () => this.handleAutofill());

    // Update stats
    const profile = await CommonUtils.getProfile();
    if (profile) {
      await panelUI.updateFieldStats(this.currentForm, profile);
    }
  }

  /**
   * Handle autofill click
   */
  async handleAutofill() {
    console.log('[NeoApply Ashby] Starting autofill...');

    const btn = this.panel?.querySelector('#neoapply-autofill-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="neoapply-btn-icon">⏳</span> Filling...';
    }

    try {
      const profile = await CommonUtils.getProfile();

      if (!profile) {
        CommonUtils.showStatus('error', 'Please set up your profile in settings first.');
        return;
      }

      // Run autofill
      const results = await this.engine.autoFill(this.currentForm, profile, {
        humanLike: true,
        validateAfter: true,
        scrollIntoView: true,
        focus: true
      });

      // Show results
      const message = `✅ Filled ${results.filled.length} fields successfully!`;
      CommonUtils.showStatus('success', message);

      // Handle file uploads
      if (results.fileUploads.length > 0) {
        CommonUtils.highlightFileUploads(results.fileUploads);
        CommonUtils.showStatus('info', `📎 Please attach your resume`, 10000);
      }

      // Log application
      await CommonUtils.logApplication({ atsType: this.ATS_TYPE });

    } catch (error) {
      console.error('[NeoApply Ashby] Autofill error:', error);
      CommonUtils.showStatus('error', 'Auto-fill failed: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="neoapply-btn-icon">⚡</span> Auto-Fill Form';
      }
    }
  }

  /**
   * Observe page changes
   */
  observePageChanges() {
    const observer = new MutationObserver(() => {
      clearTimeout(this.observeTimeout);
      this.observeTimeout = setTimeout(() => {
        if (!this.currentForm || !document.contains(this.currentForm)) {
          console.log('[NeoApply Ashby] Form changed, re-detecting...');
          this.detectAndInit();
        }
      }, 1000);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle messages from extension
   */
  async handleMessage(message, sendResponse) {
    switch (message.type) {
      case 'PING':
        sendResponse({ status: 'ok', hasForm: !!this.currentForm, atsType: this.ATS_TYPE });
        break;

      case 'TRIGGER_AUTOFILL':
        await this.handleAutofill();
        sendResponse({ status: 'ok' });
        break;

      case 'GET_FORM_INFO':
        sendResponse({
          hasForm: !!this.currentForm,
          atsType: this.ATS_TYPE,
          isWizard: false
        });
        break;

      default:
        sendResponse({ status: 'unknown_message_type' });
    }
  }
}

// Initialize when script loads
const handler = new AshbyApplicationHandler();
handler.init();

console.log('[NeoApply Ashby] Content script loaded ✅');
