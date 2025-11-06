// Popup script
import { login } from '../utils/api.js';
import { setJWT, removeJWT, getJWT, isAuthenticated, setExtensionEnabled, isExtensionEnabled, getStorageItem, STORAGE_KEYS } from '../utils/storage.js';
import { API_BASE_URL } from '../utils/config.js';

// DOM elements
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const loginText = document.getElementById('login-text');
const loginSpinner = document.getElementById('login-spinner');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const openOptionsBtn = document.getElementById('open-options');
const openAppBtn = document.getElementById('open-app');
const toggleExtensionBtn = document.getElementById('toggle-extension');
const openSignupLink = document.getElementById('open-signup');

// Initialize popup
async function init() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    await showDashboard();
  } else {
    showLogin();
  }
}

/**
 * Show login view
 */
function showLogin() {
  loginView.style.display = 'flex';
  dashboardView.style.display = 'none';
}

/**
 * Show dashboard view
 */
async function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'flex';

  // Load user data
  await loadUserData();
}

/**
 * Load user data from storage/API
 */
async function loadUserData() {
  try {
    // Get user email from storage
    const email = await getStorageItem(STORAGE_KEYS.USER_EMAIL);
    if (email) {
      document.getElementById('user-email').textContent = email;

      // Set initials
      const initials = email.split('@')[0].substring(0, 2).toUpperCase();
      document.getElementById('user-initials').textContent = initials;
    }

    // Load stats (placeholder - implement API call later)
    // For now, just show 0
    document.getElementById('applications-count').textContent = '0';
    document.getElementById('resumes-count').textContent = '0';

    // Update extension toggle button
    const enabled = await isExtensionEnabled();
    updateToggleButton(enabled);
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}

/**
 * Update extension toggle button
 */
function updateToggleButton(enabled) {
  const icon = toggleExtensionBtn.querySelector('.action-icon');
  const label = toggleExtensionBtn.querySelector('.action-label');

  if (enabled) {
    icon.textContent = '✅';
    label.textContent = 'Extension Enabled';
    toggleExtensionBtn.style.borderColor = '#10b981';
    toggleExtensionBtn.style.background = '#d1fae5';
  } else {
    icon.textContent = '⏸️';
    label.textContent = 'Extension Disabled';
    toggleExtensionBtn.style.borderColor = '#f59e0b';
    toggleExtensionBtn.style.background = '#fef3c7';
  }
}

/**
 * Handle login form submission
 */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Clear previous errors
  loginError.textContent = '';
  loginError.classList.remove('show');

  // Disable button and show spinner
  loginBtn.disabled = true;
  loginText.style.display = 'none';
  loginSpinner.style.display = 'block';

  try {
    const response = await login(email, password);

    // Backend returns { data: { user, token } }
    if (response.data && response.data.token) {
      // Save JWT to storage via background
      await chrome.runtime.sendMessage({
        type: 'SET_JWT',
        payload: { token: response.data.token }
      });

      // Save email
      await chrome.storage.local.set({
        [STORAGE_KEYS.USER_EMAIL]: email
      });

      // Show dashboard
      await showDashboard();
    } else {
      throw new Error('No token received');
    }
  } catch (error) {
    loginError.textContent = error.message || 'Login failed. Please check your credentials.';
    loginError.classList.add('show');
  } finally {
    loginBtn.disabled = false;
    loginText.style.display = 'block';
    loginSpinner.style.display = 'none';
  }
});

/**
 * Handle logout
 */
logoutBtn.addEventListener('click', async () => {
  try {
    // Remove JWT
    await chrome.runtime.sendMessage({
      type: 'REMOVE_JWT'
    });

    // Clear storage
    await chrome.storage.local.clear();

    // Show login
    showLogin();
  } catch (error) {
    console.error('Logout error:', error);
  }
});

/**
 * Open options page
 */
openOptionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

/**
 * Open NeoApply web app
 */
openAppBtn.addEventListener('click', () => {
  const appUrl = API_BASE_URL.replace('/api/v1', '');
  chrome.tabs.create({ url: appUrl });
  window.close();
});

/**
 * Toggle extension enabled/disabled
 */
toggleExtensionBtn.addEventListener('click', async () => {
  const currentState = await isExtensionEnabled();
  const newState = !currentState;

  await setExtensionEnabled(newState);
  updateToggleButton(newState);

  // Notify all tabs
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      type: 'EXTENSION_TOGGLED',
      payload: { enabled: newState }
    }).catch(() => {
      // Ignore errors for tabs without content scripts
    });
  });
});

/**
 * Open signup page
 */
openSignupLink.addEventListener('click', (e) => {
  e.preventDefault();
  const signupUrl = API_BASE_URL.replace('/api/v1', '/signup');
  chrome.tabs.create({ url: signupUrl });
  window.close();
});

// Initialize on load
init();
