// Autofill panel UI component
import { DEBUG } from '../utils/config.js';
import { getAutofillProfile, getResumes, generateTailoredAnswers } from '../utils/api.js';
import { mapFormFields, autofillForm, extractJobDescription, getFieldMetadata } from '../utils/field-mapper.js';

export class AutofillPanel {
  constructor() {
    this.panel = null;
    this.form = null;
    this.fieldMap = null;
    this.profile = null;
    this.resumes = [];
    this.selectedResumeId = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  /**
   * Initialize the panel
   * @param {HTMLFormElement} form - The form to autofill
   */
  async init(form) {
    this.form = form;
    this.fieldMap = mapFormFields(form);

    // Load autofill data from background
    await this.loadAutofillData();

    // Create and inject panel
    this.createPanel();
    this.attachEventListeners();

    // Check authentication
    await this.checkAuthStatus();
  }

  /**
   * Load autofill profile and resumes from storage/API
   */
  async loadAutofillData() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_AUTOFILL_DATA'
      });

      if (response.success) {
        this.profile = response.profile;
        this.selectedResumeId = response.defaultResumeId;
      }

      // Fetch resumes from API
      try {
        const resumesData = await getResumes();
        // Backend returns { data: [...] }
        this.resumes = resumesData.data || [];
      } catch (error) {
        console.warn('[AutofillPanel] Could not fetch resumes:', error.message);
      }
    } catch (error) {
      console.error('[AutofillPanel] Failed to load autofill data:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_AUTH'
      });

      if (!response.authenticated) {
        this.showLoginPrompt();
      } else if (!this.profile) {
        this.showSetupPrompt();
      }
    } catch (error) {
      console.error('[AutofillPanel] Auth check failed:', error);
    }
  }

  /**
   * Create the panel DOM element
   */
  createPanel() {
    // Remove existing panel if any
    const existing = document.getElementById('neoapply-autofill-panel');
    if (existing) {
      existing.remove();
    }

    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'neoapply-autofill-panel';
    this.panel.className = 'neoapply-panel';

    // Build panel HTML
    this.panel.innerHTML = `
      <div class="neoapply-panel-header">
        <h3 class="neoapply-panel-title">
          <span class="neoapply-panel-logo">N</span>
          NeoApply
        </h3>
        <button class="neoapply-panel-close" id="neoapply-close">&times;</button>
      </div>
      <div class="neoapply-panel-body" id="neoapply-body">
        ${this.renderBody()}
      </div>
    `;

    document.body.appendChild(this.panel);
  }

  /**
   * Render panel body content
   */
  renderBody() {
    const fieldsDetected = this.fieldMap.size;

    return `
      <div class="neoapply-section">
        <h4 class="neoapply-section-title">Detected Fields</h4>
        <div class="neoapply-status neoapply-status-info">
          Found ${fieldsDetected} fillable field${fieldsDetected !== 1 ? 's' : ''}
        </div>
      </div>

      ${this.resumes.length > 0 ? `
        <div class="neoapply-section">
          <h4 class="neoapply-section-title">Resume</h4>
          <select class="neoapply-resume-select" id="neoapply-resume-select">
            ${this.resumes.map(resume => `
              <option value="${resume.id}" ${resume.id === this.selectedResumeId ? 'selected' : ''}>
                ${resume.file_name || 'Resume ' + resume.id}
              </option>
            `).join('')}
          </select>
        </div>
      ` : ''}

      <div class="neoapply-section">
        <h4 class="neoapply-section-title">Actions</h4>
        <button class="neoapply-btn neoapply-btn-primary" id="neoapply-autofill">
          <span>✨ Autofill Form</span>
        </button>
        <button class="neoapply-btn neoapply-btn-secondary" id="neoapply-tailor-answers">
          <span>🎯 Get Tailored Answers</span>
        </button>
        <button class="neoapply-btn neoapply-btn-secondary" id="neoapply-attach-resume">
          <span>📎 Prepare Resume Attachment</span>
        </button>
      </div>

      <div id="neoapply-results"></div>
    `;
  }

  /**
   * Show login prompt
   */
  showLoginPrompt() {
    const body = document.getElementById('neoapply-body');
    if (!body) return;

    body.innerHTML = `
      <div class="neoapply-status neoapply-status-warning">
        Please log in to use NeoApply autofill
      </div>
      <button class="neoapply-btn neoapply-btn-primary" id="neoapply-open-login">
        Log In
      </button>
    `;

    const loginBtn = document.getElementById('neoapply-open-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
      });
    }
  }

  /**
   * Show setup prompt
   */
  showSetupPrompt() {
    const body = document.getElementById('neoapply-body');
    if (!body) return;

    body.innerHTML = `
      <div class="neoapply-status neoapply-status-info">
        Complete your autofill profile to get started
      </div>
      <button class="neoapply-btn neoapply-btn-primary" id="neoapply-open-options">
        Set Up Profile
      </button>
    `;

    const setupBtn = document.getElementById('neoapply-open-options');
    if (setupBtn) {
      setupBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
      });
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close button
    const closeBtn = document.getElementById('neoapply-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Autofill button
    const autofillBtn = document.getElementById('neoapply-autofill');
    if (autofillBtn) {
      autofillBtn.addEventListener('click', () => this.handleAutofill());
    }

    // Tailored answers button
    const tailorBtn = document.getElementById('neoapply-tailor-answers');
    if (tailorBtn) {
      tailorBtn.addEventListener('click', () => this.handleTailoredAnswers());
    }

    // Attach resume button
    const attachBtn = document.getElementById('neoapply-attach-resume');
    if (attachBtn) {
      attachBtn.addEventListener('click', () => this.handleAttachResume());
    }

    // Resume select
    const resumeSelect = document.getElementById('neoapply-resume-select');
    if (resumeSelect) {
      resumeSelect.addEventListener('change', (e) => {
        this.selectedResumeId = parseInt(e.target.value);
      });
    }

    // Draggable header
    const header = this.panel.querySelector('.neoapply-panel-header');
    if (header) {
      header.addEventListener('mousedown', (e) => this.startDrag(e));
    }
  }

  /**
   * Handle autofill action
   */
  async handleAutofill() {
    if (!this.profile) {
      this.showMessage('Please set up your autofill profile first', 'error');
      return;
    }

    const btn = document.getElementById('neoapply-autofill');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="neoapply-spinner"></span> Filling...';
    }

    try {
      const results = autofillForm(this.fieldMap, this.profile);

      if (results.filled > 0) {
        this.showMessage(
          `Successfully filled ${results.filled} field${results.filled !== 1 ? 's' : ''}!`,
          'success'
        );

        // Log application attempt
        await this.logApplication('autofilled');
      } else {
        this.showMessage('No matching fields found to autofill', 'warning');
      }
    } catch (error) {
      console.error('[AutofillPanel] Autofill error:', error);
      this.showMessage('Failed to autofill form', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>✨ Autofill Form</span>';
      }
    }
  }

  /**
   * Handle tailored answers generation
   */
  async handleTailoredAnswers() {
    if (!this.selectedResumeId) {
      this.showMessage('Please select a resume first', 'warning');
      return;
    }

    const btn = document.getElementById('neoapply-tailor-answers');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="neoapply-spinner"></span> Generating...';
    }

    try {
      // Extract job description from page
      const jobText = extractJobDescription();

      if (!jobText || jobText.length < 100) {
        this.showMessage('Could not extract job description from page', 'error');
        return;
      }

      // Get textarea fields metadata
      const textareas = Array.from(this.form.querySelectorAll('textarea'));
      const fieldsMetadata = textareas.map(getFieldMetadata);

      // Call API to generate suggestions
      const response = await generateTailoredAnswers(
        jobText,
        this.selectedResumeId,
        fieldsMetadata
      );

      if (response.suggestions && response.suggestions.length > 0) {
        this.renderSuggestions(response.suggestions, textareas);
      } else {
        this.showMessage('No suggestions generated', 'warning');
      }
    } catch (error) {
      console.error('[AutofillPanel] Tailored answers error:', error);
      this.showMessage('Failed to generate tailored answers: ' + error.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>🎯 Get Tailored Answers</span>';
      }
    }
  }

  /**
   * Render AI suggestions
   */
  renderSuggestions(suggestions, textareas) {
    const resultsDiv = document.getElementById('neoapply-results');
    if (!resultsDiv) return;

    resultsDiv.innerHTML = `
      <div class="neoapply-section">
        <h4 class="neoapply-section-title">Tailored Suggestions</h4>
        ${suggestions.map((suggestion, index) => `
          <div class="neoapply-suggestion">
            <div class="neoapply-suggestion-label">${suggestion.field_label}</div>
            <div class="neoapply-suggestion-text">${suggestion.text}</div>
            <div class="neoapply-suggestion-actions">
              <button class="neoapply-btn neoapply-btn-small neoapply-btn-success" data-index="${index}">
                Insert
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Attach insert handlers
    resultsDiv.querySelectorAll('button[data-index]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const suggestion = suggestions[index];
        const textarea = textareas[index];

        if (textarea) {
          textarea.value = suggestion.text;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));

          this.showMessage('Answer inserted successfully!', 'success');
        }
      });
    });
  }

  /**
   * Handle resume attachment
   */
  async handleAttachResume() {
    const fileInput = this.fieldMap.get('resume');

    if (!fileInput) {
      this.showMessage('No resume upload field detected on this form', 'warning');
      return;
    }

    // Highlight the file input
    fileInput.classList.add('neoapply-file-highlight');
    fileInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Show message
    this.showMessage(
      'File input highlighted! Click it to attach your resume. Due to browser security, we cannot auto-attach files.',
      'info'
    );

    // Remove highlight after 10 seconds
    setTimeout(() => {
      fileInput.classList.remove('neoapply-file-highlight');
    }, 10000);
  }

  /**
   * Log application to backend
   */
  async logApplication(status) {
    try {
      const url = window.location.href;
      const company = this.extractCompanyName();
      const role = this.extractRoleName();

      await chrome.runtime.sendMessage({
        type: 'LOG_APPLICATION',
        payload: {
          company,
          role,
          url,
          atsType: this.detectAtsType(),
          status,
          resumeId: this.selectedResumeId
        }
      });
    } catch (error) {
      console.error('[AutofillPanel] Failed to log application:', error);
    }
  }

  /**
   * Extract company name from page
   */
  extractCompanyName() {
    // Try common selectors
    const selectors = [
      '.company-name',
      '[class*="company"]',
      'meta[property="og:site_name"]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el.getAttribute('content') || el.textContent.trim();
      }
    }

    // Fallback to hostname
    return window.location.hostname.split('.')[0];
  }

  /**
   * Extract role/job title from page
   */
  extractRoleName() {
    const selectors = [
      'h1',
      '.job-title',
      '[class*="job-title"]',
      'meta[property="og:title"]'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        return el.getAttribute('content') || el.textContent.trim();
      }
    }

    return 'Unknown Role';
  }

  /**
   * Detect ATS type from URL
   */
  detectAtsType() {
    const url = window.location.href;
    if (url.includes('greenhouse')) return 'greenhouse';
    if (url.includes('lever')) return 'lever';
    if (url.includes('workday')) return 'workday';
    if (url.includes('adp')) return 'adp';
    return 'unknown';
  }

  /**
   * Show status message
   */
  showMessage(text, type = 'info') {
    const resultsDiv = document.getElementById('neoapply-results');
    if (!resultsDiv) return;

    const messageHTML = `
      <div class="neoapply-status neoapply-status-${type}">
        ${text}
      </div>
    `;

    resultsDiv.innerHTML = messageHTML;

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (resultsDiv.innerHTML === messageHTML) {
        resultsDiv.innerHTML = '';
      }
    }, 5000);
  }

  /**
   * Start dragging
   */
  startDrag(e) {
    this.isDragging = true;
    const rect = this.panel.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;

    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }

  /**
   * Drag panel
   */
  drag(e) {
    if (!this.isDragging) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    this.panel.style.left = `${x}px`;
    this.panel.style.top = `${y}px`;
    this.panel.style.right = 'auto';
  }

  /**
   * Stop dragging
   */
  stopDrag() {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.drag);
    document.removeEventListener('mouseup', this.stopDrag);
  }

  /**
   * Show panel
   */
  show() {
    if (this.panel) {
      this.panel.style.display = 'flex';
    }
  }

  /**
   * Hide panel
   */
  hide() {
    if (this.panel) {
      this.panel.style.display = 'none';
    }
  }

  /**
   * Destroy panel
   */
  destroy() {
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
  }
}
