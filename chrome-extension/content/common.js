/**
 * Common/Shared Module for Job Application Automation
 *
 * This module contains all reusable functionality that can be shared
 * across different platform-specific scripts.
 *
 * Export: AutoFillEngine, EnhancedFieldMapper, UniversalFormDetector,
 *         PanelUI, CommonUtils
 */

import { UniversalFormDetector } from '../utils/universal-detector.js';
import { EnhancedFieldMapper } from '../utils/enhanced-field-mapper.js';
import { AutoFillEngine } from '../utils/autofill-engine.js';

/**
 * Common utilities shared across all platforms
 */
export class CommonUtils {
  /**
   * Get autofill profile from storage
   */
  static async getProfile() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['neoapply_autofill_profile'], (result) => {
        resolve(result.neoapply_autofill_profile || null);
      });
    });
  }

  /**
   * Get JWT token from background
   */
  static async getJWT() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_JWT' }, (response) => {
        resolve(response?.token || null);
      });
    });
  }

  /**
   * Show status message
   */
  static showStatus(type, message, duration = 5000) {
    const statusEl = document.querySelector('#neoapply-status');
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
   * Promise-based delay
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log application to backend
   */
  static async logApplication(data) {
    try {
      chrome.runtime.sendMessage({
        type: 'LOG_APPLICATION',
        data: {
          company: data.company || CommonUtils.extractCompanyName(),
          role: data.role || CommonUtils.extractJobTitle(),
          url: window.location.href,
          atsType: data.atsType || 'Unknown',
          status: data.status || 'in_progress'
        }
      });
    } catch (error) {
      console.error('[NeoApply Common] Error logging application:', error);
    }
  }

  /**
   * Extract company name from page
   */
  static extractCompanyName() {
    const patterns = [
      'meta[property="og:site_name"]',
      'meta[name="company"]',
      '[class*="company-name"]',
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

    return window.location.hostname.replace('www.', '');
  }

  /**
   * Extract job title from page
   */
  static extractJobTitle() {
    const patterns = [
      'h1[class*="job"]',
      'h1[class*="title"]',
      '[class*="job-title"]',
      '[data-qa="job-title"]',
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
   * Extract job description from page
   */
  static extractJobDescription() {
    const selectors = [
      '.job-description',
      '[class*="description"]',
      '[class*="job-details"]',
      'article',
      'main'
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.length > 200) {
        return el.textContent;
      }
    }

    return document.body.textContent;
  }

  /**
   * Highlight file upload fields
   */
  static highlightFileUploads(fileUploads) {
    fileUploads.forEach(({ field }) => {
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      field.style.border = '2px solid #667eea';
      field.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
      field.style.transition = 'all 0.3s ease';
    });
  }

  /**
   * Detect if page has CAPTCHA
   */
  static detectCaptcha() {
    const indicators = [
      'iframe[src*="recaptcha"]',
      'iframe[src*="hcaptcha"]',
      '[class*="captcha"]',
      '#captcha',
      'script[src*="recaptcha"]'
    ];

    for (const selector of indicators) {
      if (document.querySelector(selector)) {
        return {
          hasCaptcha: true,
          type: selector.includes('recaptcha') ? 'reCAPTCHA' : 'hCaptcha'
        };
      }
    }

    return { hasCaptcha: false };
  }
}

/**
 * Common UI Panel that can be used by all platform scripts
 */
export class PanelUI {
  constructor(options = {}) {
    this.atsType = options.atsType || 'Unknown';
    this.wizardState = options.wizardState || null;
    this.panel = null;
  }

  /**
   * Inject the autofill panel
   */
  async inject() {
    // Check if already injected
    if (document.getElementById('neoapply-panel')) {
      console.log('[NeoApply Panel] Panel already exists');
      return;
    }

    console.log('[NeoApply Panel] Injecting panel...');

    // Create panel container
    const panel = document.createElement('div');
    panel.id = 'neoapply-panel';
    panel.className = 'neoapply-panel';

    // Build panel HTML
    panel.innerHTML = this.getPanelHTML();

    document.body.appendChild(panel);

    // Inject CSS
    this.injectStyles();

    // Attach event listeners
    this.attachListeners(panel);

    this.panel = panel;
  }

  /**
   * Get panel HTML structure
   */
  getPanelHTML() {
    return `
      <div class="neoapply-header">
        <div class="neoapply-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 11L12 14L22 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <path d="M21 12V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V5C3 3.9 3.9 3 5 3H16" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>NeoApply</span>
          ${this.atsType !== 'Unknown' ? `<span class="neoapply-badge">${this.atsType}</span>` : ''}
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

      .neoapply-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
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
   * Attach event listeners
   */
  attachListeners(panel) {
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
  async updateFieldStats(form, profile) {
    const mapper = new EnhancedFieldMapper();
    const { mappings, unmapped } = mapper.mapFields(form, profile);

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
            const name = mapper.getFieldIdentifier(field);
            return `<div style="padding: 8px; background: #f8f9fa; border-radius: 4px; margin-bottom: 6px;">${name}</div>`;
          })
          .join('');

        if (unmapped.length > 5) {
          unmappedList.innerHTML += `<div class="neoapply-hint">...and ${unmapped.length - 5} more</div>`;
        }
      }
    }
  }
}

// Export all common modules
export {
  UniversalFormDetector,
  EnhancedFieldMapper,
  AutoFillEngine
};
