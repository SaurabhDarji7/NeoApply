/**
 * Generic/Fallback Content Script
 *
 * This script handles job applications on sites that don't match
 * any specific ATS platform. Uses intelligent heuristics to detect
 * and auto-fill application forms.
 *
 * Used as fallback for:
 * - Custom company career pages
 * - Unknown ATS platforms
 * - Non-standard application forms
 */

import {
  CommonUtils,
  PanelUI,
  UniversalFormDetector,
  EnhancedFieldMapper,
  AutoFillEngine
} from './common.js';

class GenericApplicationHandler {
  constructor() {
    this.ATS_TYPE = 'Generic';
    this.detector = new UniversalFormDetector();
    this.mapper = new EnhancedFieldMapper();
    this.engine = new AutoFillEngine();
    this.panel = null;
    this.currentForm = null;
    this.wizardState = null;
  }

  /**
   * Initialize generic handler
   */
  async init() {
    console.log('[NeoApply Generic] Initializing...');

    // Generic sites vary, give reasonable time to load
    await CommonUtils.delay(1000);

    await this.detectAndInit();

    // Observe for dynamic content changes (SPAs)
    this.observePageChanges();

    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true;
    });
  }

  /**
   * Detect application form and initialize UI
   */
  async detectAndInit() {
    console.log('[NeoApply Generic] Detecting application form...');

    // Use universal detector with scoring
    const detection = this.detector.detectApplicationForm();

    if (!detection) {
      console.log('[NeoApply Generic] No application form detected on this page');
      return;
    }

    this.currentForm = detection.form;
    console.log('[NeoApply Generic] ✅ Application form detected (confidence:', detection.confidence + ')');

    // Try to detect specific ATS type from page
    const detectedATS = this.detectATSType();
    if (detectedATS !== 'Unknown') {
      this.ATS_TYPE = detectedATS;
      console.log('[NeoApply Generic] Detected ATS type:', detectedATS);
    }

    // Check for wizard/multi-step form
    this.wizardState = this.detector.detectWizard();
    if (this.wizardState.isWizard) {
      console.log('[NeoApply Generic] 📝 Multi-step form detected:', this.wizardState);
    }

    // Inject autofill panel
    await this.injectPanel();
  }

  /**
   * Try to detect ATS type from page content
   */
  detectATSType() {
    const url = window.location.href.toLowerCase();
    const html = document.documentElement.innerHTML;

    // Check URL patterns
    if (url.includes('greenhouse.io')) return 'Greenhouse';
    if (url.includes('lever.co')) return 'Lever';
    if (url.includes('workday.com') || url.includes('myworkdayjobs.com')) return 'Workday';
    if (url.includes('icims.com')) return 'iCIMS';
    if (url.includes('smartrecruiters.com')) return 'SmartRecruiters';
    if (url.includes('taleo.net')) return 'Taleo';
    if (url.includes('ashbyhq.com')) return 'Ashby';
    if (url.includes('bamboohr.com')) return 'BambooHR';
    if (url.includes('jobvite.com')) return 'Jobvite';
    if (url.includes('breezyhr.com')) return 'Breezy HR';

    // Check HTML content
    if (html.includes('greenhouse')) return 'Greenhouse';
    if (html.includes('lever')) return 'Lever';
    if (html.includes('workday')) return 'Workday';
    if (html.includes('icims')) return 'iCIMS';

    return 'Unknown';
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

    // Attach wizard handler if needed
    if (this.wizardState?.isWizard) {
      const nextStepBtn = this.panel.querySelector('#neoapply-next-step-btn');
      nextStepBtn?.addEventListener('click', () => this.handleFillAndContinue());
    }

    // Update field stats
    const profile = await CommonUtils.getProfile();
    if (profile) {
      await panelUI.updateFieldStats(this.currentForm, profile);
    }
  }

  /**
   * Handle autofill button click
   */
  async handleAutofill() {
    console.log('[NeoApply Generic] Starting autofill...');

    const btn = this.panel?.querySelector('#neoapply-autofill-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="neoapply-btn-icon">⏳</span> Filling...';
    }

    try {
      // Get profile from storage
      const profile = await CommonUtils.getProfile();

      if (!profile) {
        CommonUtils.showStatus('error', 'Please set up your profile in the extension settings first.');
        return;
      }

      // Check for CAPTCHA
      const captchaInfo = CommonUtils.detectCaptcha();
      if (captchaInfo.hasCaptcha) {
        CommonUtils.showStatus('warning', `⚠️ This form has a ${captchaInfo.type}. Please solve it first, then click autofill again.`, 10000);
      }

      // Run autofill engine
      const results = await this.engine.autoFill(this.currentForm, profile, {
        humanLike: true,
        validateAfter: true,
        scrollIntoView: true,
        focus: true
      });

      // Show results
      const message = `✅ Filled ${results.filled.length} fields successfully!`;
      CommonUtils.showStatus('success', message);

      // Highlight file uploads if any
      if (results.fileUploads.length > 0) {
        CommonUtils.highlightFileUploads(results.fileUploads);
        CommonUtils.showStatus('info', `📎 Please attach your resume to ${results.fileUploads.length} file field(s)`, 10000);
      }

      // Log application
      await CommonUtils.logApplication({ atsType: this.ATS_TYPE });

    } catch (error) {
      console.error('[NeoApply Generic] Autofill error:', error);
      CommonUtils.showStatus('error', 'Auto-fill failed: ' + error.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="neoapply-btn-icon">⚡</span> Auto-Fill Form';
      }
    }
  }

  /**
   * Handle fill and continue for wizard forms
   */
  async handleFillAndContinue() {
    await this.handleAutofill();

    // Wait for fields to settle
    await CommonUtils.delay(1000);

    // Find and click next button
    const nextBtn = this.detector.findNextButton();
    if (nextBtn) {
      console.log('[NeoApply Generic] Clicking next button...');
      nextBtn.click();

      // Wait for next step to load
      await CommonUtils.delay(1500);

      // Re-detect form and update UI
      this.detectAndInit();
    } else {
      CommonUtils.showStatus('warning', 'Could not find "Next" button. Please click it manually.');
    }
  }

  /**
   * Observe page changes for SPAs
   */
  observePageChanges() {
    const observer = new MutationObserver(() => {
      // Debounce: only check after 500ms of no changes
      clearTimeout(this.observeTimeout);
      this.observeTimeout = setTimeout(() => {
        if (!this.currentForm || !document.contains(this.currentForm)) {
          console.log('[NeoApply Generic] Form disappeared, re-detecting...');
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
    console.log('[NeoApply Generic] Received message:', message.type);

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
const handler = new GenericApplicationHandler();
handler.init();

console.log('[NeoApply Generic] Content script loaded ✅');
