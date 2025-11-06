// Lever ATS content script
import { AutofillPanel } from '../ui/autofill-panel.js';
import { DEBUG } from '../utils/config.js';

let panel = null;
let formObserver = null;

/**
 * Detect if current page is a Lever application form
 */
function isApplicationForm() {
  // Check for Lever-specific selectors
  const indicators = [
    'form.application-form',
    'div.application-form',
    '[class*="ApplicationForm"]',
    '[class*="application"]',
    'input[name="name"]',
    'input[name="email"]',
    'input[name="phone"]',
    '[data-qa="application-form"]'
  ];

  return indicators.some(selector => document.querySelector(selector) !== null);
}

/**
 * Find the main application form
 */
function findApplicationForm() {
  // Try specific Lever form selectors
  const selectors = [
    'form.application-form',
    'form[class*="Application"]',
    'div.application-form form',
    '[data-qa="application-form"]',
    'form[action*="apply"]'
  ];

  for (const selector of selectors) {
    const form = document.querySelector(selector);
    if (form) {
      // If it's a div, find the form inside
      if (form.tagName === 'DIV') {
        return form.querySelector('form') || form;
      }
      return form;
    }
  }

  // Fallback: find any form with multiple inputs (Lever often uses React-rendered forms)
  const forms = document.querySelectorAll('form');
  for (const form of forms) {
    const inputs = form.querySelectorAll('input, textarea, select');
    if (inputs.length >= 3) {
      // Verify it has typical application fields
      const hasEmail = form.querySelector('input[type="email"], input[name*="email"]');
      const hasName = form.querySelector('input[name*="name"]');
      if (hasEmail || hasName) {
        return form;
      }
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
      console.log('[Lever] Not an application form, skipping');
    }
    return;
  }

  // Wait a bit for React to fully render the form
  await new Promise(resolve => setTimeout(resolve, 1000));

  const form = findApplicationForm();
  if (!form) {
    if (DEBUG) {
      console.log('[Lever] No application form found');
    }
    return;
  }

  if (DEBUG) {
    console.log('[Lever] Application form detected:', form);
  }

  // Check if extension is enabled
  const response = await chrome.runtime.sendMessage({
    type: 'CHECK_AUTH'
  });

  // Create and initialize panel
  panel = new AutofillPanel();
  await panel.init(form);

  if (DEBUG) {
    console.log('[Lever] NeoApply panel initialized');
  }
}

/**
 * Observe DOM changes to detect dynamically loaded forms (Lever uses React)
 */
function observeFormChanges() {
  formObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        // Check if a form was added
        const hasForm = Array.from(mutation.addedNodes).some(node =>
          node.nodeType === Node.ELEMENT_NODE &&
          (node.tagName === 'FORM' ||
           node.querySelector('form') ||
           node.classList?.contains('application-form'))
        );

        if (hasForm && !panel) {
          if (DEBUG) {
            console.log('[Lever] Form detected after mutation');
          }
          // Re-initialize after a delay to ensure React has rendered
          setTimeout(() => initPanel(), 1500);
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
    // Lever forms are often React-rendered, so wait a bit
    setTimeout(() => {
      initPanel();
      observeFormChanges();
    }, 1500);
  });
} else {
  setTimeout(() => {
    initPanel();
    observeFormChanges();
  }, 1500);
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
  console.log('[Lever] NeoApply content script loaded');
}
