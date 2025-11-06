// Chrome storage utilities with promise-based API
import { STORAGE_KEYS } from './config.js';

/**
 * Get item from chrome.storage.local
 * @param {string} key - Storage key
 * @returns {Promise<any>} Stored value
 */
export async function getStorageItem(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

/**
 * Set item in chrome.storage.local
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @returns {Promise<void>}
 */
export async function setStorageItem(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

/**
 * Remove item from chrome.storage.local
 * @param {string} key - Storage key
 * @returns {Promise<void>}
 */
export async function removeStorageItem(key) {
  return new Promise((resolve) => {
    chrome.storage.local.remove([key], resolve);
  });
}

/**
 * Get multiple items from storage
 * @param {string[]} keys - Array of storage keys
 * @returns {Promise<Object>}
 */
export async function getStorageItems(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, resolve);
  });
}

/**
 * Clear all storage
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve);
  });
}

// Authentication helpers
export async function getJWT() {
  return getStorageItem(STORAGE_KEYS.JWT_TOKEN);
}

export async function setJWT(token) {
  return setStorageItem(STORAGE_KEYS.JWT_TOKEN, token);
}

export async function removeJWT() {
  return removeStorageItem(STORAGE_KEYS.JWT_TOKEN);
}

export async function isAuthenticated() {
  const token = await getJWT();
  if (!token) return false;

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < expiresAt;
  } catch (error) {
    console.error('Invalid JWT token:', error);
    return false;
  }
}

// Autofill profile helpers
export async function getAutofillProfile() {
  return getStorageItem(STORAGE_KEYS.AUTOFILL_PROFILE);
}

export async function setAutofillProfile(profile) {
  return setStorageItem(STORAGE_KEYS.AUTOFILL_PROFILE, profile);
}

// Resume helpers
export async function getDefaultResumeId() {
  return getStorageItem(STORAGE_KEYS.DEFAULT_RESUME_ID);
}

export async function setDefaultResumeId(resumeId) {
  return setStorageItem(STORAGE_KEYS.DEFAULT_RESUME_ID, resumeId);
}

// Extension state helpers
export async function isExtensionEnabled() {
  const enabled = await getStorageItem(STORAGE_KEYS.EXTENSION_ENABLED);
  return enabled !== false; // Default to true
}

export async function setExtensionEnabled(enabled) {
  return setStorageItem(STORAGE_KEYS.EXTENSION_ENABLED, enabled);
}

export async function isDebugMode() {
  return getStorageItem(STORAGE_KEYS.DEBUG_MODE) || false;
}

export async function setDebugMode(enabled) {
  return setStorageItem(STORAGE_KEYS.DEBUG_MODE, enabled);
}
