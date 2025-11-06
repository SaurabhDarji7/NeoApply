// API client for NeoApply backend
import { API_BASE_URL, DEBUG } from './config.js';

/**
 * Make API request with automatic JWT handling
 * @param {string} endpoint - API endpoint (e.g., '/resumes')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get JWT from background service worker
  const token = await chrome.runtime.sendMessage({
    type: 'GET_JWT'
  });

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // token is already a string, not an object
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  if (DEBUG) {
    console.log('[NeoApply API]', options.method || 'GET', url, config);
  }

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      // Notify background to clear token
      await chrome.runtime.sendMessage({
        type: 'AUTH_EXPIRED'
      });
      throw new Error('Authentication expired. Please log in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (DEBUG) {
      console.log('[NeoApply API] Response:', data);
    }

    return data;
  } catch (error) {
    if (DEBUG) {
      console.error('[NeoApply API] Error:', error);
    }
    throw error;
  }
}

// Auth endpoints
export async function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ user: { email, password } })
  });
}

export async function logout() {
  return apiRequest('/auth/logout', {
    method: 'DELETE'
  });
}

// Autofill profile endpoints
export async function getAutofillProfile() {
  return apiRequest('/extension/autofill_profile');
}

export async function updateAutofillProfile(profile) {
  return apiRequest('/extension/autofill_profile', {
    method: 'PUT',
    body: JSON.stringify({ profile })
  });
}

// Resume endpoints
export async function getResumes() {
  return apiRequest('/resumes');
}

export async function getResume(id) {
  return apiRequest(`/resumes/${id}`);
}

export async function getResumeDownloadUrl(id) {
  return `${API_BASE_URL}/resumes/${id}/download`;
}

// Application tracking endpoints
export async function createApplication(applicationData) {
  return apiRequest('/extension/applications', {
    method: 'POST',
    body: JSON.stringify({ application: applicationData })
  });
}

export async function updateApplication(id, updates) {
  return apiRequest(`/extension/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ application: updates })
  });
}

export async function getApplications(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiRequest(`/extension/applications?${params}`);
}

// AI-powered tailored answers
export async function generateTailoredAnswers(jobText, resumeId, fieldsMetadata = []) {
  return apiRequest('/extension/answers/generate', {
    method: 'POST',
    body: JSON.stringify({
      job_text: jobText,
      resume_id: resumeId,
      fields_metadata: fieldsMetadata
    })
  });
}

// Job description parsing (reuse existing endpoint)
export async function parseJobDescription(jobText, sourceUrl = null) {
  return apiRequest('/job_descriptions/parse', {
    method: 'POST',
    body: JSON.stringify({
      job_description: {
        description: jobText,
        source_url: sourceUrl
      }
    })
  });
}

// Template endpoints (to fetch generated PDF)
export async function getTemplatePreview(templateId, jobId) {
  return apiRequest(`/templates/${templateId}/preview?job_id=${jobId}`);
}

export async function downloadTemplatePdf(templateId, jobId) {
  return `${API_BASE_URL}/templates/${templateId}/download?job_id=${jobId}`;
}
