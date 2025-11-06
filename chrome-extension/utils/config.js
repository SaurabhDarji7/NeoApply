// Environment configuration
const CONFIG = {
  development: {
    API_BASE_URL: 'http://localhost:3000/api/v1',
    DEBUG: true
  },
  production: {
    API_BASE_URL: 'https://api.neoapply.com/api/v1',
    DEBUG: false
  }
};

// Auto-detect environment (can be overridden in options page)
const ENV = 'development'; // Change to 'production' for production build

export const API_BASE_URL = CONFIG[ENV].API_BASE_URL;
export const DEBUG = CONFIG[ENV].DEBUG;

export const STORAGE_KEYS = {
  JWT_TOKEN: 'neoapply_jwt_token',
  USER_EMAIL: 'neoapply_user_email',
  AUTOFILL_PROFILE: 'neoapply_autofill_profile',
  DEFAULT_RESUME_ID: 'neoapply_default_resume_id',
  EXTENSION_ENABLED: 'neoapply_enabled',
  DEBUG_MODE: 'neoapply_debug_mode'
};

export const ATS_TYPES = {
  GREENHOUSE: 'greenhouse',
  LEVER: 'lever',
  WORKDAY: 'workday',
  ADP: 'adp'
};

// JWT expiry buffer (5 minutes before actual expiry)
export const JWT_EXPIRY_BUFFER = 5 * 60 * 1000;
