// Background service worker for NeoApply extension
import { STORAGE_KEYS, JWT_EXPIRY_BUFFER, DEBUG } from '../utils/config.js';
import { getJWT, setJWT, removeJWT, isAuthenticated } from '../utils/storage.js';

// Listen for extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('NeoApply extension installed');
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    console.log('NeoApply extension updated');
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((error) => {
      console.error('Message handler error:', error);
      sendResponse({ error: error.message });
    });

  // Return true to indicate async response
  return true;
});

async function handleMessage(message, sender) {
  const { type, payload } = message;

  if (DEBUG) {
    console.log('[Background] Received message:', type, payload);
  }

  switch (type) {
    case 'GET_JWT':
      return await getJWT();

    case 'SET_JWT':
      await setJWT(payload.token);
      return { success: true };

    case 'REMOVE_JWT':
      await removeJWT();
      return { success: true };

    case 'CHECK_AUTH':
      return { authenticated: await isAuthenticated() };

    case 'AUTH_EXPIRED':
      await removeJWT();
      // Notify all tabs that auth expired
      notifyAllTabs('AUTH_EXPIRED');
      return { success: true };

    case 'DOWNLOAD_RESUME':
      return handleResumeDownload(payload);

    case 'LOG_APPLICATION':
      return handleApplicationLog(payload);

    case 'GET_AUTOFILL_DATA':
      return handleGetAutofillData();

    case 'DEBUG_LOG':
      if (DEBUG) {
        console.log('[Content Script Debug]:', payload);
      }
      return { success: true };

    default:
      console.warn('Unknown message type:', type);
      return { error: 'Unknown message type' };
  }
}

/**
 * Handle resume download request
 * @param {Object} payload - { resumeId, url, filename }
 */
async function handleResumeDownload(payload) {
  const { url, filename } = payload;

  try {
    const downloadId = await chrome.downloads.download({
      url,
      filename: filename || 'resume.pdf',
      saveAs: false // Auto-download to default location
    });

    return {
      success: true,
      downloadId
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle application tracking log
 * @param {Object} payload - Application data
 */
async function handleApplicationLog(payload) {
  // Store application data locally for sync later
  const { company, role, url, atsType, status, resumeId } = payload;

  try {
    // Get existing applications
    const stored = await chrome.storage.local.get(['applications']);
    const applications = stored.applications || [];

    // Add new application
    applications.push({
      company,
      role,
      url,
      ats_type: atsType,
      status,
      used_resume_id: resumeId,
      applied_at: new Date().toISOString(),
      synced: false
    });

    // Save back to storage
    await chrome.storage.local.set({ applications });

    // Attempt to sync to backend if authenticated
    if (await isAuthenticated()) {
      await syncApplications();
    }

    return { success: true };
  } catch (error) {
    console.error('Application log error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Sync local applications to backend
 */
async function syncApplications() {
  const stored = await chrome.storage.local.get(['applications']);
  const applications = stored.applications || [];
  const unsynced = applications.filter(app => !app.synced);

  if (unsynced.length === 0) return;

  const token = await getJWT();
  if (!token) return;

  // Import API_BASE_URL dynamically
  const { API_BASE_URL } = await import('../utils/config.js');

  for (const app of unsynced) {
    try {
      await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ application: app })
      });

      // Mark as synced
      app.synced = true;
    } catch (error) {
      console.error('Failed to sync application:', error);
    }
  }

  // Save updated applications
  await chrome.storage.local.set({ applications });
}

/**
 * Get autofill data from storage and backend
 */
async function handleGetAutofillData() {
  try {
    const stored = await chrome.storage.local.get([
      STORAGE_KEYS.AUTOFILL_PROFILE,
      STORAGE_KEYS.DEFAULT_RESUME_ID
    ]);

    return {
      success: true,
      profile: stored[STORAGE_KEYS.AUTOFILL_PROFILE] || null,
      defaultResumeId: stored[STORAGE_KEYS.DEFAULT_RESUME_ID] || null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Notify all content scripts in all tabs
 * @param {string} type - Message type
 * @param {Object} payload - Message payload
 */
async function notifyAllTabs(type, payload = {}) {
  const tabs = await chrome.tabs.query({});

  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, { type, payload }).catch(() => {
      // Ignore errors for tabs without content scripts
    });
  });
}

// Periodic token validation (every 5 minutes)
setInterval(async () => {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    await removeJWT();
  }
}, 5 * 60 * 1000);

// Listen for tab updates to inject content scripts dynamically if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Content scripts will auto-inject via manifest
    if (DEBUG) {
      console.log('[Background] Tab updated:', tab.url);
    }
  }
});

console.log('NeoApply background service worker loaded');
