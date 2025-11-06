/**
 * Universal Content Script
 * Works on ANY job application site using heuristics
 *
 * This script runs on all pages and intelligently detects job application forms
 */

import { UniversalFormDetector } from '../utils/universal-detector.js';
import { EnhancedFieldMapper } from '../utils/enhanced-field-mapper.js';
import { AutoFillEngine } from '../utils/autofill-engine.js';

class UniversalJobApplicationHandler {
  constructor() {
    this.detector = new UniversalFormDetector();
    this.mapper = new EnhancedFieldMapper();
    this.engine = new AutoFillEngine();

    this.panel = null;
    this.currentForm = null;
    this.wizardState = null;
    this.observing = false;
  }

  /**
   * Initialize the handler
   */
  async init() {
    console.log('[NeoApply Universal] Initializing...');

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectAndInit());
    } else {
      this.detectAndInit();
    }

    // Listen for dynamic content changes (SPAs)
    this.observePageChanges();

    // Listen for messages from background/popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sendResponse);
      return true; // Keep channel open for async response
    });
  }

  /**
   * Detect application form and initialize UI
   */
  async detectAndInit() {
    console.log('[NeoApply Universal] Detecting application form...');

    // Detect form
    const detection = this.detector.detectApplicationForm();

    if (!detection) {
      console.log('[NeoApply Universal] No application form detected on this page');
      return;
    }

    this.currentForm = detection.form;
    console.log('[NeoApply Universal] ✅ Application form detected (confidence:', detection.confidence + ')');

    // Check for wizard/multi-step form
    this.wizardState = this.detector.detectWizard();
    if (this.wizardState.isWizard) {
      console.log('[NeoApply Universal] 📝 Multi-step form detected:', this.wizardState);
    }

    // Inject autofill panel
    await this.injectPanel();

    // Observe wizard navigation
    if (this.wizardState.isWizard) {
      this.observeWizardNavigation();
    }
  }

  /**
   * Inject the autofill panel UI
   */
  async injectPanel() {
    // Check if already injected
    if (document.getElementById('neoapply-panel')) {
      console.log('[NeoApply Universal] Panel already exists');
      return;
    }

    console.log('[NeoApply Universal] Injecting autofill panel...');

    // Create panel container
    const panel = document.createElement('div');
    panel.id = 'neoapply-panel';
    panel.className = 'neoapply-panel';

    // Build panel HTML
    panel.innerHTML = `
      <div class="neoapply-header">
        <div class="neoapply-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>NeoApply</span>
        </div>
        <div class="neoapply-actions">
          <button id="neoapply-minimize" class="neoapply-icon-btn" title="Minimize">−</button>
          <button id="neoapply-close" class="neoapply-icon-btn" title="Close">×</button>
        </div>
      </div>

      <div class="neoapply-body">
        <div id="neoapply-status" class="neoapply-status"></div>

        <div class="neoapply-section">
          <h3>Auto-Fill Application</h3>
          <p class="neoapply-hint">Fill this form with your saved profile</p>
          <button id="neoapply-autofill-btn" class="neoapply-btn neoapply-btn-primary">
            <span class="neoapply-btn-icon">⚡</span>
            Auto-Fill Form
          </button>
        </div>

        ${this.wizardState?.isWizard ? `
        <div class="neoapply-section neoapply-wizard-info">
          <div class="neoapply-wizard-progress">
            <span class="neoapply-wizard-step">Step ${this.wizardState.currentStep}</span>
            ${this.wizardState.totalSteps ? `<span class="neoapply-wizard-total">of ${this.wizardState.totalSteps}</span>` : ''}
          </div>
          <button id="neoapply-next-step-btn" class="neoapply-btn neoapply-btn-secondary">
            Fill & Continue →
          </button>
        </div>
        ` : ''}

        <div class="neoapply-section">
          <h3>Field Detection</h3>
          <div id="neoapply-field-stats" class="neoapply-stats">
            Scanning form...
          </div>
        </div>

        <div id="neoapply-unmapped-section" class="neoapply-section" style="display: none;">
          <h3>Unmapped Fields</h3>
          <p class="neoapply-hint">These fields couldn't be auto-filled</p>
          <div id="neoapply-unmapped-list"></div>
        </div>

        <div class="neoapply-section">
          <button id="neoapply-settings-btn" class="neoapply-btn neoapply-btn-text">
            ⚙️ Settings
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Add CSS
    this.injectStyles();

    // Add event listeners
    this.attachPanelListeners(panel);

    // Scan and display field stats
    await this.updateFieldStats();

    this.panel = panel;
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    if (document.getElementById('neoapply-styles')) return;

    const style = document.createElement('style');
    style.id = 'neoapply-styles';
    style.textContent = `
      .neoapply-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 360px;
        max-height: 600px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 14px;
        overflow: hidden;
        transition: all 0.3s ease;
      }

      .neoapply-panel.minimized {
        max-height: 60px;
      }

      .neoapply-panel.minimized .neoapply-body {
        display: none;
      }

      .neoapply-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: move;
        user-select: none;
      }

      .neoapply-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 16px;
      }

      .neoapply-actions {
        display: flex;
        gap: 4px;
      }

      .neoapply-icon-btn {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        transition: background 0.2s;
      }

      .neoapply-icon-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .neoapply-body {
        padding: 16px;
        max-height: 540px;
        overflow-y: auto;
      }

      .neoapply-section {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f0f0f0;
      }

      .neoapply-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      .neoapply-section h3 {
        margin: 0 0 8px 0;
        font-size: 14px;
        font-weight: 600;
        color: #1a1a1a;
      }

      .neoapply-hint {
        margin: 0 0 12px 0;
        font-size: 12px;
        color: #666;
      }

      .neoapply-btn {
        width: 100%;
        padding: 12px 16px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s;
      }

      .neoapply-btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .neoapply-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .neoapply-btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .neoapply-btn-secondary {
        background: #f8f9fa;
        color: #667eea;
        border: 1px solid #e0e0e0;
      }

      .neoapply-btn-secondary:hover {
        background: #e9ecef;
      }

      .neoapply-btn-text {
        background: transparent;
        color: #666;
        padding: 8px 12px;
      }

      .neoapply-btn-text:hover {
        background: #f8f9fa;
      }

      .neoapply-btn-icon {
        font-size: 16px;
      }

      .neoapply-status {
        margin-bottom: 16px;
        padding: 12px;
        border-radius: 8px;
        font-size: 13px;
        display: none;
      }

      .neoapply-status.show {
        display: block;
        animation: slideDown 0.3s ease;
      }

      .neoapply-status.success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .neoapply-status.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .neoapply-status.warning {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeeba;
      }

      .neoapply-status.info {
        background: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }

      .neoapply-stats {
        background: #f8f9fa;
        padding: 12px;
        border-radius: 6px;
        font-size: 13px;
        color: #495057;
      }

      .neoapply-wizard-info {
        background: #f0f4ff;
        border: 1px solid #c7d7fe;
        border-radius: 8px;
        padding: 12px;
      }

      .neoapply-wizard-progress {
        margin-bottom: 8px;
        font-size: 13px;
        color: #4c51bf;
        font-weight: 500;
      }

      .neoapply-wizard-step {
        font-weight: 600;
      }

      .neoapply-unmapped-list {
        font-size: 12px;
        color: #666;
      }

      .neoapply-unmapped-item {
        padding: 8px;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 6px;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .neoapply-panel {
          right: 10px;
          left: 10px;
          width: auto;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * Attach event listeners to panel
   */
  attachPanelListeners(panel) {
    // Autofill button
    const autofillBtn = panel.querySelector('#neoapply-autofill-btn');
    autofillBtn?.addEventListener('click', () => this.handleAutofill());

    // Next step button (wizard)
    const nextStepBtn = panel.querySelector('#neoapply-next-step-btn');
    nextStepBtn?.addEventListener('click', () => this.handleFillAndContinue());

    // Minimize button
    const minimizeBtn = panel.querySelector('#neoapply-minimize');
    minimizeBtn?.addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });

    // Close button
    const closeBtn = panel.querySelector('#neoapply-close');
    closeBtn?.addEventListener('click', () => {
      panel.remove();
      this.panel = null;
    });

    // Settings button
    const settingsBtn = panel.querySelector('#neoapply-settings-btn');
    settingsBtn?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
    });

    // Make draggable
    this.makeDraggable(panel);
  }

  /**
   * Make panel draggable
   */
  makeDraggable(panel) {
    const header = panel.querySelector('.neoapply-header');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      initialX = e.clientX - panel.offsetLeft;
      initialY = e.clientY - panel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      panel.style.left = currentX + 'px';
      panel.style.top = currentY + 'px';
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  /**
   * Update field statistics
   */
  async updateFieldStats() {
    if (!this.currentForm) return;

    const profile = await this.getProfile();
    const { mappings, unmapped } = this.mapper.mapFields(this.currentForm, profile);

    const statsEl = this.panel?.querySelector('#neoapply-field-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div><strong>${mappings.size}</strong> fields can be auto-filled</div>
        <div><strong>${unmapped.length}</strong> fields need manual input</div>
      `;
    }

    // Show unmapped fields
    if (unmapped.length > 0) {
      const unmappedSection = this.panel?.querySelector('#neoapply-unmapped-section');
      const unmappedList = this.panel?.querySelector('#neoapply-unmapped-list');

      if (unmappedSection && unmappedList) {
        unmappedSection.style.display = 'block';
        unmappedList.innerHTML = unmapped
          .slice(0, 5)
          .map(field => {
            const name = this.mapper.getFieldIdentifier(field);
            return `<div class="neoapply-unmapped-item">${name}</div>`;
          })
          .join('');

        if (unmapped.length > 5) {
          unmappedList.innerHTML += `<div class="neoapply-hint">...and ${unmapped.length - 5} more</div>`;
        }
      }
    }
  }

  /**
   * Handle autofill button click
   */
  async handleAutofill() {
    console.log('[NeoApply Universal] Starting autofill...');

    const btn = this.panel?.querySelector('#neoapply-autofill-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="neoapply-btn-icon">⏳</span> Filling...';
    }

    try {
      // Get profile from storage
      const profile = await this.getProfile();

      if (!profile) {
        this.showStatus('error', 'Please set up your profile in the extension settings first.');
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
      this.showStatus('success', message);

      // Highlight file uploads if any
      if (results.fileUploads.length > 0) {
        this.highlightFileUploads(results.fileUploads);
        this.showStatus('info', `📎 Please attach your resume to ${results.fileUploads.length} file field(s)`, 10000);
      }

      // Log application
      await this.logApplication();

    } catch (error) {
      console.error('[NeoApply Universal] Autofill error:', error);
      this.showStatus('error', 'Auto-fill failed: ' + error.message);
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

    // Wait a bit for fields to settle
    await this.delay(1000);

    // Find and click next button
    const nextBtn = this.detector.findNextButton();
    if (nextBtn) {
      console.log('[NeoApply Universal] Clicking next button...');
      nextBtn.click();

      // Wait for next step to load
      await this.delay(1500);

      // Re-detect form and update UI
      this.detectAndInit();
    } else {
      this.showStatus('warning', 'Could not find "Next" button. Please click it manually.');
    }
  }

  /**
   * Get autofill profile from storage
   */
  async getProfile() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['neoapply_autofill_profile'], (result) => {
        resolve(result.neoapply_autofill_profile || null);
      });
    });
  }

  /**
   * Show status message
   */
  showStatus(type, message, duration = 5000) {
    const statusEl = this.panel?.querySelector('#neoapply-status');
    if (!statusEl) return;

    statusEl.className = `neoapply-status show ${type}`;
    statusEl.textContent = message;

    if (duration > 0) {
      setTimeout(() => {
        statusEl.classList.remove('show');
      }, duration);
    }
  }

  /**
   * Highlight file upload fields
   */
  highlightFileUploads(fileUploads) {
    fileUploads.forEach(({ field }) => {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.style.border = '2px solid #667eea';
      field.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
    });
  }

  /**
   * Log application to backend
   */
  async logApplication() {
    try {
      const company = this.extractCompanyName();
      const role = this.extractJobTitle();
      const atsType = this.detectATSType();

      chrome.runtime.sendMessage({
        type: 'LOG_APPLICATION',
        data: {
          company,
          role,
          url: window.location.href,
          atsType,
          status: 'in_progress'
        }
      });
    } catch (error) {
      console.error('[NeoApply Universal] Error logging application:', error);
    }
  }

  /**
   * Extract company name from page
   */
  extractCompanyName() {
    // Try common patterns
    const patterns = [
      'meta[property="og:site_name"]',
      'meta[name="company"]',
      '[class*="company"]',
      'h1, h2'
    ];

    for (const pattern of patterns) {
      const el = document.querySelector(pattern);
      if (el) {
        const text = el.getAttribute('content') || el.textContent;
        if (text && text.length < 100) {
          return text.trim();
        }
      }
    }

    // Fallback to hostname
    return window.location.hostname.replace('www.', '');
  }

  /**
   * Extract job title from page
   */
  extractJobTitle() {
    const patterns = [
      'h1[class*="job"]',
      'h1[class*="title"]',
      '[class*="job-title"]',
      'h1'
    ];

    for (const pattern of patterns) {
      const el = document.querySelector(pattern);
      if (el && el.textContent) {
        return el.textContent.trim();
      }
    }

    return 'Unknown Position';
  }

  /**
   * Detect ATS type from URL/DOM
   */
  detectATSType() {
    const url = window.location.href.toLowerCase();
    const html = document.documentElement.innerHTML;

    if (url.includes('greenhouse.io') || html.includes('greenhouse')) return 'Greenhouse';
    if (url.includes('lever.co') || html.includes('lever')) return 'Lever';
    if (url.includes('workday.com') || html.includes('workday')) return 'Workday';
    if (url.includes('icims.com') || html.includes('icims')) return 'iCIMS';
    if (url.includes('smartrecruiters.com')) return 'SmartRecruiters';
    if (url.includes('taleo.net')) return 'Taleo';
    if (url.includes('myworkdayjobs.com')) return 'Workday';
    if (url.includes('bamboohr.com')) return 'BambooHR';

    return 'Unknown';
  }

  /**
   * Observe page changes for SPAs
   */
  observePageChanges() {
    if (this.observing) return;

    const observer = new MutationObserver((mutations) => {
      // Debounce: only check after 500ms of no changes
      clearTimeout(this.observeTimeout);
      this.observeTimeout = setTimeout(() => {
        if (!this.currentForm || !document.contains(this.currentForm)) {
          console.log('[NeoApply Universal] Form disappeared, re-detecting...');
          this.detectAndInit();
        }
      }, 500);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observing = true;
  }

  /**
   * Observe wizard navigation (next/back buttons)
   */
  observeWizardNavigation() {
    // Watch for step changes
    const observer = new MutationObserver(() => {
      const newWizardState = this.detector.detectWizard();
      if (newWizardState.currentStep !== this.wizardState?.currentStep) {
        console.log('[NeoApply Universal] Wizard step changed:', newWizardState.currentStep);
        this.wizardState = newWizardState;
        this.updateFieldStats();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /**
   * Handle messages from extension
   */
  async handleMessage(message, sendResponse) {
    console.log('[NeoApply Universal] Received message:', message.type);

    switch (message.type) {
      case 'PING':
        sendResponse({ status: 'ok', hasForm: !!this.currentForm });
        break;

      case 'TRIGGER_AUTOFILL':
        await this.handleAutofill();
        sendResponse({ status: 'ok' });
        break;

      case 'GET_FORM_INFO':
        sendResponse({
          hasForm: !!this.currentForm,
          isWizard: this.wizardState?.isWizard,
          currentStep: this.wizardState?.currentStep,
          totalSteps: this.wizardState?.totalSteps
        });
        break;

      default:
        sendResponse({ status: 'unknown_message_type' });
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize when script loads
const handler = new UniversalJobApplicationHandler();
handler.init();

console.log('[NeoApply Universal] Content script loaded ✅');
