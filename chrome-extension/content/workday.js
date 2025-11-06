/**
 * Workday ATS Content Script
 *
 * Workday is the largest ATS platform with ~40% market share.
 * Handles job applications on *.myworkdayjobs.com domains.
 *
 * Common patterns:
 * - Multi-step wizard forms (typically 5-7 steps)
 * - Heavy use of data-automation-id attributes
 * - React-based UI with dynamic loading
 * - Custom dropdown components (not native <select>)
 */

import {
  CommonUtils,
  PanelUI,
  UniversalFormDetector,
  EnhancedFieldMapper,
  AutoFillEngine
} from './common.js';

class WorkdayApplicationHandler {
  constructor() {
    this.ATS_TYPE = 'Workday';
    this.detector = new UniversalFormDetector();
    this.mapper = new EnhancedFieldMapper();
    this.engine = new AutoFillEngine();
    this.panel = null;
    this.currentForm = null;
    this.wizardState = null;
  }

  /**
   * Workday-specific form selectors
   */
  WORKDAY_SELECTORS = {
    form: '[data-automation-id="jobApplication"], form[id*="wd-application"]',
    firstName: '[data-automation-id="legalNameSection_firstName"], input[name*="firstName"]',
    lastName: '[data-automation-id="legalNameSection_lastName"], input[name*="lastName"]',
    email: '[data-automation-id="email"], input[type="email"]',
    phone: '[data-automation-id="phone"], input[type="tel"]',
    address: '[data-automation-id="addressSection_addressLine1"]',
    city: '[data-automation-id="addressSection_city"]',
    state: '[data-automation-id="addressSection_countryRegion"]',
    zip: '[data-automation-id="addressSection_postalCode"]',
    nextButton: '[data-automation-id="bottom-navigation-next-button"]',
    submitButton: '[data-automation-id="bottom-navigation-submit-button"]',
    stepIndicator: '[data-automation-id="step-label"]'
  };

  /**
   * Initialize Workday handler
   */
  async init() {
    console.log('[NeoApply Workday] Initializing...');

    // Workday uses React with delayed rendering
    await CommonUtils.delay(2000);

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
   * Detect Workday form and initialize UI
   */
  async detectAndInit() {
    console.log('[NeoApply Workday] Detecting application form...');

    // Try Workday-specific selectors first
    this.currentForm = document.querySelector(this.WORKDAY_SELECTORS.form);

    if (!this.currentForm) {
      // Fallback to generic detection
      const detection = this.detector.detectApplicationForm();
      if (detection) {
        this.currentForm = detection.form;
      }
    }

    if (!this.currentForm) {
      console.log('[NeoApply Workday] No application form detected');
      return;
    }

    console.log('[NeoApply Workday] ✅ Form detected');

    // Detect wizard state
    this.wizardState = this.detectWorkdayWizard();

    // Inject panel
    await this.injectPanel();
  }

  /**
   * Detect Workday wizard state
   */
  detectWorkdayWizard() {
    const stepIndicator = document.querySelector(this.WORKDAY_SELECTORS.stepIndicator);

    if (stepIndicator) {
      const text = stepIndicator.textContent;
      const match = text.match(/(\d+)\s*of\s*(\d+)/);

      if (match) {
        return {
          isWizard: true,
          currentStep: parseInt(match[1]),
          totalSteps: parseInt(match[2])
        };
      }
    }

    // Fallback to generic wizard detection
    return this.detector.detectWizard();
  }

  /**
   * Inject autofill panel
   */
  async injectPanel() {
    const panelUI = new PanelUI({
      atsType: this.ATS_TYPE,
      wizardState: this.wizardState
    });

    await panelUI.inject();
    this.panel = panelUI.panel;

    // Attach autofill handler
    const autofillBtn = this.panel.querySelector('#neoapply-autofill-btn');
    autofillBtn?.addEventListener('click', () => this.handleAutofill());

    // Attach wizard handler
    const nextStepBtn = this.panel.querySelector('#neoapply-next-step-btn');
    nextStepBtn?.addEventListener('click', () => this.handleFillAndContinue());

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
    console.log('[NeoApply Workday] Starting autofill...');

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

      // Check for CAPTCHA
      const captchaInfo = CommonUtils.detectCaptcha();
      if (captchaInfo.hasCaptcha) {
        CommonUtils.showStatus('warning', `⚠️ This form has a ${captchaInfo.type}. Please solve it first.`, 10000);
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
        CommonUtils.showStatus('info', `📎 Please attach your resume to ${results.fileUploads.length} file field(s)`, 10000);
      }

      // Log application
      await CommonUtils.logApplication({ atsType: this.ATS_TYPE });

    } catch (error) {
      console.error('[NeoApply Workday] Autofill error:', error);
      CommonUtils.showStatus('error', 'Auto-fill failed: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="neoapply-btn-icon">⚡</span> Auto-Fill Form';
      }
    }
  }

  /**
   * Handle fill and continue for wizard
   */
  async handleFillAndContinue() {
    await this.handleAutofill();

    // Wait for fields to settle
    await CommonUtils.delay(1000);

    // Find and click next button
    const nextBtn = document.querySelector(this.WORKDAY_SELECTORS.nextButton);
    if (nextBtn && !nextBtn.disabled) {
      console.log('[NeoApply Workday] Clicking next button...');
      nextBtn.click();

      // Wait for next step to load
      await CommonUtils.delay(2000);

      // Re-detect and update UI
      this.detectAndInit();
    } else {
      CommonUtils.showStatus('warning', 'Could not find "Next" button or form is incomplete.');
    }
  }

  /**
   * Observe page changes for SPAs
   */
  observePageChanges() {
    const observer = new MutationObserver(() => {
      clearTimeout(this.observeTimeout);
      this.observeTimeout = setTimeout(() => {
        if (!this.currentForm || !document.contains(this.currentForm)) {
          console.log('[NeoApply Workday] Form changed, re-detecting...');
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
          isWizard: this.wizardState?.isWizard,
          currentStep: this.wizardState?.currentStep,
          totalSteps: this.wizardState?.totalSteps
        });
        break;

      default:
        sendResponse({ status: 'unknown_message_type' });
    }
  }
}

// Initialize when script loads
const handler = new WorkdayApplicationHandler();
handler.init();

console.log('[NeoApply Workday] Content script loaded ✅');
