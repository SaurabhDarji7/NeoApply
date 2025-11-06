// Greenhouse ATS content script
import { AutofillPanel } from '../ui/autofill-panel.js';
import { DEBUG } from '../utils/config.js';

let panel = null;
let formObserver = null;

/**
 * Detect if current page is a Greenhouse application form
 */
function isApplicationForm() {
  // Check for Greenhouse-specific selectors
  const indicators = [
    'form#application_form',
    'form.application-form',
    'div#application_form',
    '[data-provides="typeahead"]', // Greenhouse autocomplete
    'input[name="first_name"]',
    'input[name="last_name"]'
  ];

  return indicators.some(selector => document.querySelector(selector) !== null);
}

/**
 * Find the main application form
 */
function findApplicationForm() {
  // Try specific Greenhouse form selectors
  const selectors = [
    'form#application_form',
    'form.application-form',
    'form[action*="applications"]',
    'form[action*="submit"]'
  ];

  for (const selector of selectors) {
    const form = document.querySelector(selector);
    if (form) return form;
  }

  // Fallback: find any form with multiple inputs
  const forms = document.querySelectorAll('form');
  for (const form of forms) {
    const inputs = form.querySelectorAll('input, textarea, select');
    if (inputs.length >= 3) {
      return form;
    }
  }

  return null;
}

/**
 * Initialize the autofill panel
 */
async function initPanel() {
  if (!isApplicationForm()) {
    if (DEBUG) {
      console.log('[Greenhouse] Not an application form, skipping');
    }
    return;
  }

  const form = findApplicationForm();
  if (!form) {
    if (DEBUG) {
      console.log('[Greenhouse] No application form found');
    }
    return;
  }

  if (DEBUG) {
    console.log('[Greenhouse] Application form detected:', form);
  }

  // Check if extension is enabled
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_AUTH'
  });

  // Create and initialize panel
  panel = new AutofillPanel();
  await panel.init(form);

  if (DEBUG) {
    console.log('[Greenhouse] NeoApply panel initialized');
  }
}

/**
 * Observe DOM changes to detect dynamically loaded forms
 */
function observeFormChanges() {
  formObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check if a form was added
        const hasForm = Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.tagName === 'FORM' || node.querySelector('form'))
        );

        if (hasForm && !panel) {
          if (DEBUG) {
            console.log('[Greenhouse] Form detected after mutation');
          }
          initPanel();
        }
      }
    }
  });

  formObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Handle messages from background script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_EXPIRED') {
    if (panel) {
      panel.showLoginPrompt();
    }
  }

  sendResponse({ received: true });
});

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initPanel();
    observeFormChanges();
  });
} else {
  initPanel();
  observeFormChanges();
}

/**
 * Cleanup on page unload
 */
window.addEventListener('beforeunload', () => {
  if (panel) {
    panel.destroy();
  }
  if (formObserver) {
    formObserver.disconnect();
  }
});

if (DEBUG) {
  console.log('[Greenhouse] NeoApply content script loaded');
}
