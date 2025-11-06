/**
 * iCIMS ATS Content Script
 *
 * iCIMS is a major ATS platform used by Fortune 500 companies.
 * Handles job applications on *.icims.com domains.
 *
 * Common patterns:
 * - Traditional forms with standard HTML inputs
 * - Uses applicant.* naming convention
 * - Profile-based system (can save and reuse data)
 * - May have multiple forms on same page
 */

import {
  CommonUtils,
  PanelUI,
  UniversalFormDetector,
  EnhancedFieldMapper,
  AutoFillEngine
} from './common.js';

class ICIMSApplicationHandler {
  constructor() {
    this.ATS_TYPE = 'iCIMS';
    this.detector = new UniversalFormDetector();
    this.mapper = new EnhancedFieldMapper();
    this.engine = new AutoFillEngine();
    this.panel = null;
    this.currentForm = null;
  }

  /**
   * iCIMS-specific selectors
   */
  ICIMS_SELECTORS = {
    form: 'form.iCIMS_JobApply, form[id*="icims"], form[name*="apply"]',
    firstName: '#applicant\\.firstname, input[name="applicant.firstname"]',
    lastName: '#applicant\\.lastname, input[name="applicant.lastname"]',
    email: '#applicant\\.email, input[name="applicant.email"]',
    phone: '#applicant\\.phone, input[name="applicant.phone"]',
    address: '#applicant\\.address, input[name="applicant.address"]',
    city: '#applicant\\.city, input[name="applicant.city"]',
    state: '#applicant\\.state, select[name="applicant.state"]',
    zip: '#applicant\\.zip, input[name="applicant.zip"]'
  };

  /**
   * Initialize iCIMS handler
   */
  async init() {
    console.log('[NeoApply iCIMS] Initializing...');

    // iCIMS loads quickly (traditional forms)
    await CommonUtils.delay(500);

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
   * Detect iCIMS form and initialize UI
   */
  async detectAndInit() {
    console.log('[NeoApply iCIMS] Detecting application form...');

    // Try iCIMS-specific selectors first
    this.currentForm = document.querySelector(this.ICIMS_SELECTORS.form);

    if (!this.currentForm) {
      // Fallback to generic detection
      const detection = this.detector.detectApplicationForm();
      if (detection) {
        this.currentForm = detection.form;
      }
    }

    if (!this.currentForm) {
      console.log('[NeoApply iCIMS] No application form detected');
      return;
    }

    console.log('[NeoApply iCIMS] ✅ Form detected');

    // iCIMS typically doesn't use wizards
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
    console.log('[NeoApply iCIMS] Starting autofill...');

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
      console.error('[NeoApply iCIMS] Autofill error:', error);
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
          console.log('[NeoApply iCIMS] Form changed, re-detecting...');
          this.detectAndInit();
        }
      }, 500);
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
const handler = new ICIMSApplicationHandler();
handler.init();

console.log('[NeoApply iCIMS] Content script loaded ✅');
