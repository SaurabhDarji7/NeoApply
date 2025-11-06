# NeoApply Chrome Extension - Implementation Summary

## Overview

The NeoApply Chrome Extension is a Manifest V3 browser extension that automatically fills job application forms using resume data and AI-generated tailored answers. This document summarizes the implementation details.

## Project Structure

```
chrome-extension/
├── manifest.json                 # Extension manifest (Manifest V3)
├── README.md                     # User documentation
├── IMPLEMENTATION.md             # This file
│
├── assets/
│   └── icons/                    # Extension icons (SVG + placeholders for PNGs)
│       ├── icon.svg              # Vector logo
│       ├── README.md             # Icon generation instructions
│       └── .gitkeep
│
├── background/
│   └── service-worker.js         # Background service worker
│       - JWT token management
│       - API request mediation
│       - Application logging
│       - Cross-tab messaging
│
├── content/
│   ├── greenhouse.js             # Greenhouse ATS content script
│   └── lever.js                  # Lever ATS content script
│       - Form detection
│       - Panel initialization
│       - DOM mutation observers
│
├── popup/
│   ├── popup.html                # Extension popup UI
│   ├── popup.css                 # Popup styles
│   └── popup.js                  # Popup logic
│       - Login/logout
│       - Dashboard
│       - Quick actions
│
├── options/
│   ├── options.html              # Options page UI
│   ├── options.css               # Options page styles
│   └── options.js                # Options page logic
│       - Autofill profile management
│       - Resume selection
│       - Extension settings
│
├── ui/
│   ├── panel.css                 # In-page panel styles
│   └── autofill-panel.js         # Autofill panel component
│       - Autofill form functionality
│       - Tailored answers generation
│       - Resume attachment helper
│
└── utils/
    ├── config.js                 # Configuration constants
    ├── storage.js                # Chrome storage utilities
    ├── api.js                    # API client for backend
    └── field-mapper.js           # Field detection and mapping
        - Label detection
        - Field type matching
        - Form autofill logic
```

## Key Components

### 1. Manifest Configuration (`manifest.json`)

- **Version**: Manifest V3
- **Permissions**:
  - `storage` - Store autofill profile and settings
  - `activeTab` - Access current job application page
  - `scripting` - Inject content scripts
  - `downloads` - Download resume files
- **Host Permissions**:
  - Greenhouse: `https://boards.greenhouse.io/*`, `https://*.greenhouse.io/*`
  - Lever: `https://jobs.lever.co/*`, `https://*.lever.co/*`
- **Content Scripts**: Auto-inject on Greenhouse and Lever domains
- **Service Worker**: Background script for API communication

### 2. Background Service Worker (`background/service-worker.js`)

**Responsibilities:**
- Securely store and manage JWT tokens
- Mediate all API requests (content scripts never access JWT directly)
- Handle token expiration and re-authentication
- Log applications to backend
- Sync autofill data between storage and API
- Manage extension lifecycle events

**Message Types:**
- `GET_JWT` - Retrieve JWT token
- `SET_JWT` - Store JWT token
- `REMOVE_JWT` - Clear JWT token
- `CHECK_AUTH` - Verify authentication status
- `AUTH_EXPIRED` - Handle token expiration
- `DOWNLOAD_RESUME` - Trigger resume download
- `LOG_APPLICATION` - Log application attempt
- `GET_AUTOFILL_DATA` - Fetch autofill profile

### 3. Content Scripts

#### Greenhouse Script (`content/greenhouse.js`)

**Detection:**
- Looks for `form#application_form` or similar Greenhouse-specific selectors
- Validates presence of typical fields (`first_name`, `last_name`, etc.)

**Initialization:**
- Detects application forms on page load
- Uses MutationObserver for dynamically loaded forms
- Initializes autofill panel when form detected

#### Lever Script (`content/lever.js`)

**Detection:**
- Lever uses React-rendered forms, so detection is more dynamic
- Looks for `.application-form`, `[class*="ApplicationForm"]`
- Waits for React to fully render before initialization

**Initialization:**
- Delayed initialization (1.5s) to account for React rendering
- MutationObserver with longer timeout for dynamic content

### 4. Autofill Panel (`ui/autofill-panel.js`)

**Features:**
- **Smart Form Detection**: Maps form fields to profile data
- **One-Click Autofill**: Fills all detected fields automatically
- **AI Tailored Answers**: Generates cover letters and custom responses
- **Resume Attachment Helper**: Highlights file upload field (manual selection required)
- **Draggable UI**: Panel can be repositioned on the page

**User Flow:**
1. Panel appears automatically on supported job pages
2. User clicks "Autofill Form" to fill basic information
3. User clicks "Get Tailored Answers" for AI-generated cover letter
4. User clicks "Prepare Resume Attachment" to locate file upload field
5. User manually selects resume file (browser security limitation)

**Styling:**
- Modern gradient design matching NeoApply brand
- Responsive and accessible
- Minimal footprint, unobtrusive placement

### 5. Field Mapping Utility (`utils/field-mapper.js`)

**Field Type Detection:**

Supports the following field types with multiple detection strategies:
- Personal: `firstName`, `lastName`, `fullName`, `email`, `phone`
- Address: `address`, `city`, `state`, `zip`, `country`
- Links: `linkedin`, `github`, `portfolio`
- Documents: `resume`, `coverLetter`

**Detection Priority:**
1. Exact `name` attribute match
2. Partial `name` attribute match
3. Label text keyword match
4. `id` attribute match
5. `aria-label` attribute

**Label Detection:**
- Checks `<label for="">` elements
- Checks parent `<label>` wrappers
- Checks `aria-label` attributes
- Checks `placeholder` text
- Checks adjacent sibling labels

**EEO Field Filtering:**
- Automatically skips demographic fields (gender, race, etc.)
- Avoids filling sensitive optional fields

**Form Filling:**
- Native value setters to bypass React/Vue detection
- Triggers `input`, `change`, and `blur` events for framework compatibility
- Idempotent (can be run multiple times without duplication)

### 6. API Client (`utils/api.js`)

**Authentication:**
- All requests include JWT in `Authorization: Bearer <token>` header
- Automatic token retrieval from background service worker
- 401 handling with re-authentication prompt

**Endpoints:**

**Auth:**
- `POST /api/v1/auth/login` - Login
- `DELETE /api/v1/auth/logout` - Logout

**Autofill Profile:**
- `GET /api/v1/autofill_profile` - Get profile
- `PUT /api/v1/autofill_profile` - Update profile

**Resumes:**
- `GET /api/v1/resumes` - List resumes
- `GET /api/v1/resumes/:id` - Get resume
- `GET /api/v1/resumes/:id/download` - Download URL

**Applications:**
- `POST /api/v1/applications` - Create application
- `PATCH /api/v1/applications/:id` - Update application
- `GET /api/v1/applications` - List applications

**AI Answers:**
- `POST /api/v1/answers/generate` - Generate tailored answers
  - Request: `{ job_text, resume_id, fields_metadata[] }`
  - Response: `{ suggestions: [{ field_label, text }] }`

### 7. Storage Utilities (`utils/storage.js`)

**Chrome Storage Keys:**
- `neoapply_jwt_token` - JWT authentication token
- `neoapply_user_email` - User email for display
- `neoapply_autofill_profile` - Complete autofill profile
- `neoapply_default_resume_id` - Selected default resume
- `neoapply_enabled` - Extension enable/disable state
- `neoapply_debug_mode` - Debug logging toggle

**Helper Functions:**
- `getJWT()`, `setJWT()`, `removeJWT()` - Auth management
- `isAuthenticated()` - Validate JWT expiration
- `getAutofillProfile()`, `setAutofillProfile()` - Profile management
- `getDefaultResumeId()`, `setDefaultResumeId()` - Resume selection
- `isExtensionEnabled()`, `setExtensionEnabled()` - Toggle state

### 8. Popup UI (`popup/`)

**Login View:**
- Email/password form
- Error handling
- Link to sign up page

**Dashboard View:**
- User info with avatar (initials)
- Application stats (placeholder for now)
- Quick actions:
  - Open options page
  - Open NeoApply web app
  - Toggle extension on/off
- Logout button

### 9. Options Page (`options/`)

**Autofill Profile Form:**
- Personal information (name, email, phone)
- Address fields (street, city, state, zip, country)
- Professional links (LinkedIn, GitHub, portfolio)
- Save locally and sync to server
- Load from server option

**Resume Selection:**
- List all uploaded resumes
- Radio button selection for default
- Shows upload date

**Extension Settings:**
- Toggle extension on/off
- Enable debug mode

**Supported Platforms:**
- Visual grid showing Greenhouse ✅, Lever ✅
- Workday 🚧, ADP 🚧 (coming soon)

## Technical Decisions

### Why Manifest V3?

- **Future-proof**: Manifest V2 is being deprecated
- **Security**: Service workers instead of background pages
- **Performance**: Better resource management
- **Best Practice**: Aligns with Chrome's recommended architecture

### Why Not Automatically Attach Files?

Browser security restrictions prevent extensions from programmatically setting `<input type="file">` values. This is a fundamental security feature to prevent malicious code from uploading files without user consent.

**Our Solution:**
1. Highlight the file input field
2. Provide visual guidance (tooltip)
3. User manually clicks and selects file

### Why Separate Content Scripts Per ATS?

Each ATS platform has unique:
- Form structures
- Field naming conventions
- Dynamic rendering patterns (React vs. plain HTML)
- Timing requirements

Separate content scripts allow platform-specific optimizations without bloating the codebase.

### Why MutationObserver?

Modern job sites use single-page applications (SPAs) with client-side routing. Forms may not exist on initial page load. MutationObserver detects when forms are dynamically added to the DOM.

### Why Not Use `document.execCommand`?

`document.execCommand` is deprecated and doesn't work with OnlyOffice's custom rendering. We use native DOM manipulation and proper event triggering instead.

## Integration with NeoApply Backend

### Required Backend Endpoints

The extension expects the following endpoints to exist:

**Already Implemented:**
- ✅ `POST /api/v1/auth/login`
- ✅ `GET /api/v1/resumes`
- ✅ `GET /api/v1/resumes/:id`

**To Be Implemented:**
- ❌ `GET /api/v1/autofill_profile` - New model needed
- ❌ `PUT /api/v1/autofill_profile` - New model needed
- ❌ `POST /api/v1/applications` - New model needed
- ❌ `POST /api/v1/answers/generate` - New AI service needed

### Database Schema Additions

**AutofillProfile Model:**
```ruby
class AutofillProfile < ApplicationRecord
  belongs_to :user

  # Personal
  validates :first_name, :last_name, :email, presence: true

  # Fields: first_name, last_name, email, phone,
  #         address, city, state, zip, country,
  #         linkedin, github, portfolio
end
```

**Application Model:**
```ruby
class Application < ApplicationRecord
  belongs_to :user
  belongs_to :resume, optional: true

  # Fields: company, role, url, ats_type, status,
  #         applied_at, source, notes
end
```

### CORS Configuration

Add extension to CORS whitelist in `config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'chrome-extension://[extension-id]'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options]
  end
end
```

## Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Logout clears token
- [ ] Token expiration triggers re-login prompt

**Autofill:**
- [ ] Panel appears on Greenhouse job pages
- [ ] Panel appears on Lever job pages
- [ ] Autofill correctly maps all personal fields
- [ ] Autofill correctly maps address fields
- [ ] Autofill correctly maps link fields
- [ ] Re-running autofill is idempotent

**Tailored Answers:**
- [ ] Job description extraction works
- [ ] AI suggestions are generated
- [ ] Suggestions can be inserted into textareas
- [ ] Suggestions match field context

**Resume Attachment:**
- [ ] File input is highlighted correctly
- [ ] Tooltip/guidance is visible
- [ ] User can manually select file

**Options Page:**
- [ ] Profile can be saved
- [ ] Profile can be loaded from server
- [ ] Resume list displays correctly
- [ ] Default resume can be selected
- [ ] Settings toggles work

**Popup:**
- [ ] Shows login when not authenticated
- [ ] Shows dashboard when authenticated
- [ ] Quick actions work correctly

### Automated Testing

Future work: Add Jest tests for:
- `field-mapper.js` field detection logic
- `storage.js` helper functions
- `api.js` request formatting

## Known Limitations

1. **File Upload**: Cannot programmatically attach files (browser security)
2. **ATS Coverage**: Only Greenhouse and Lever in V1
3. **Field Detection**: May miss non-standard field names
4. **Job Text Extraction**: May not work on all page layouts
5. **React/Vue Compatibility**: Relies on proper event triggering

## Future Enhancements

### V2 Features
- [ ] Workday and ADP support
- [ ] Advanced field mapping with ML
- [ ] Custom field mappings (user overrides)
- [ ] Application status tracking
- [ ] Interview scheduling integration
- [ ] Multi-language support

### V3 Features
- [ ] Auto-refresh expired tokens
- [ ] Offline mode with sync
- [ ] Browser extension for Firefox/Edge
- [ ] Voice input for cover letters
- [ ] Integration with LinkedIn for auto-import

## Deployment

### Development
```bash
# Load extension in Chrome
1. Open chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select chrome-extension/ directory
```

### Production
1. Generate icon PNGs from SVG
2. Update version in manifest.json
3. Build production bundle (if using build tools)
4. Create ZIP file of chrome-extension/
5. Upload to Chrome Web Store Developer Dashboard
6. Submit for review

## Support & Maintenance

**File Issues:**
Report bugs and feature requests in the main NeoApply repository.

**Update Frequency:**
- Bug fixes: As needed
- Feature updates: Monthly
- ATS compatibility: Quarterly reviews

**Browser Compatibility:**
- Chrome: v88+ (Manifest V3 support)
- Edge: v88+ (Chromium-based)
- Brave: Supported
- Opera: Supported
- Firefox: Future (requires different manifest)

---

**Implementation Date**: January 5, 2025
**Version**: 1.0.0
**Developer**: NeoApply Team
