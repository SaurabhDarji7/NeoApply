// Options page script
import { getAutofillProfile, updateAutofillProfile, getResumes } from '../utils/api.js';
import { setAutofillProfile, getAutofillProfile as getStoredProfile, setDefaultResumeId, getDefaultResumeId, setExtensionEnabled, isExtensionEnabled, setDebugMode, isDebugMode } from '../utils/storage.js';

// DOM elements
const profileForm = document.getElementById('profile-form');
const saveBtn = document.getElementById('save-btn');
const saveText = document.getElementById('save-text');
const saveSpinner = document.getElementById('save-spinner');
const loadBtn = document.getElementById('load-btn');
const statusMessage = document.getElementById('status-message');
const resumeList = document.getElementById('resume-list');
const extensionEnabledToggle = document.getElementById('extension-enabled');
const debugModeToggle = document.getElementById('debug-mode');

// Initialize options page
async function init() {
  // Load saved profile
  await loadProfile();

  // Load resumes
  await loadResumes();

  // Load settings
  await loadSettings();

  // Attach event listeners
  attachEventListeners();
}

/**
 * Load profile from storage
 */
async function loadProfile() {
  try {
    const profile = await getStoredProfile();

    if (profile) {
      // Fill form fields
      document.getElementById('first_name').value = profile.first_name || '';
      document.getElementById('last_name').value = profile.last_name || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('phone').value = profile.phone || '';
      document.getElementById('address').value = profile.address || '';
      document.getElementById('city').value = profile.city || '';
      document.getElementById('state').value = profile.state || '';
      document.getElementById('zip').value = profile.zip || '';
      document.getElementById('country').value = profile.country || 'United States';
      document.getElementById('linkedin').value = profile.linkedin || '';
      document.getElementById('github').value = profile.github || '';
      document.getElementById('portfolio').value = profile.portfolio || '';
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

/**
 * Load resumes from API
 */
async function loadResumes() {
  try {
    const response = await getResumes();
    // Backend returns { data: [...] }
    const resumes = response.data || [];
    const defaultResumeId = await getDefaultResumeId();

    if (resumes.length === 0) {
      resumeList.innerHTML = '<div class="loading">No resumes found. Upload resumes in the NeoApply app.</div>';
      return;
    }

    // Render resume list
    resumeList.innerHTML = resumes.map(resume => `
      <div class="resume-item ${resume.id === defaultResumeId ? 'selected' : ''}" data-resume-id="${resume.id}">
        <input
          type="radio"
          name="default_resume"
          class="resume-radio"
          value="${resume.id}"
          ${resume.id === defaultResumeId ? 'checked' : ''}
        />
        <div class="resume-info">
          <div class="resume-name">${resume.file_name || 'Resume ' + resume.id}</div>
          <div class="resume-meta">Uploaded ${formatDate(resume.created_at)}</div>
        </div>
      </div>
    `).join('');

    // Attach click handlers
    resumeList.querySelectorAll('.resume-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        const resumeId = parseInt(item.dataset.resumeId);
        const radio = item.querySelector('.resume-radio');

        // Update UI
        resumeList.querySelectorAll('.resume-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        radio.checked = true;

        // Save to storage
        await setDefaultResumeId(resumeId);

        showStatus('Default resume updated', 'success');
      });
    });
  } catch (error) {
    console.error('Failed to load resumes:', error);
    resumeList.innerHTML = '<div class="loading">Failed to load resumes. Please try again.</div>';
  }
}

/**
 * Load extension settings
 */
async function loadSettings() {
  const enabled = await isExtensionEnabled();
  const debug = await isDebugMode();

  extensionEnabledToggle.checked = enabled;
  debugModeToggle.checked = debug;
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Save profile
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveProfile();
  });

  // Load from server
  loadBtn.addEventListener('click', async () => {
    await loadFromServer();
  });

  // Extension enabled toggle
  extensionEnabledToggle.addEventListener('change', async (e) => {
    await setExtensionEnabled(e.target.checked);
    showStatus(`Extension ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
  });

  // Debug mode toggle
  debugModeToggle.addEventListener('change', async (e) => {
    await setDebugMode(e.target.checked);
    showStatus(`Debug mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'success');
  });
}

/**
 * Save profile to storage and server
 */
async function saveProfile() {
  // Get form data
  const profile = {
    first_name: document.getElementById('first_name').value,
    last_name: document.getElementById('last_name').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value,
    country: document.getElementById('country').value,
    linkedin: document.getElementById('linkedin').value,
    github: document.getElementById('github').value,
    portfolio: document.getElementById('portfolio').value
  };

  // Disable button
  saveBtn.disabled = true;
  saveText.style.display = 'none';
  saveSpinner.style.display = 'block';

  try {
    // Save to local storage
    await setAutofillProfile(profile);

    // Try to sync to server
    try {
      await updateAutofillProfile(profile);
      showStatus('Profile saved successfully!', 'success');
    } catch (apiError) {
      // If API fails, still save locally
      console.warn('Failed to sync to server:', apiError.message);
      showStatus('Profile saved locally (server sync failed)', 'success');
    }
  } catch (error) {
    console.error('Failed to save profile:', error);
    showStatus('Failed to save profile: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveText.style.display = 'block';
    saveSpinner.style.display = 'none';
  }
}

/**
 * Load profile from server
 */
async function loadFromServer() {
  loadBtn.disabled = true;
  loadBtn.textContent = 'Loading...';

  try {
    const response = await getAutofillProfile();
    const profile = response.profile;

    if (profile) {
      // Save to local storage
      await setAutofillProfile(profile);

      // Update form
      await loadProfile();

      showStatus('Profile loaded from server', 'success');
    } else {
      showStatus('No profile found on server', 'error');
    }
  } catch (error) {
    console.error('Failed to load from server:', error);
    showStatus('Failed to load from server: ' + error.message, 'error');
  } finally {
    loadBtn.disabled = false;
    loadBtn.textContent = 'Load from Server';
  }
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 5000);
}

/**
 * Format date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Initialize on load
init();
