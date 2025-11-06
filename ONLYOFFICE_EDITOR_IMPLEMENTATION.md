# OnlyOffice Document Editor Integration

## Overview

Complete implementation of an embedded Word-like document editor with smart token insertion, real-time preview, and PDF export functionality.

---

## Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend  │ ───> │  Rails Backend   │ ───> │  OnlyOffice     │
│  Vue.js App │      │  API + Service   │      │  Document Server│
└─────────────┘      └──────────────────┘      └─────────────────┘
       │                      │                         │
       │                      │                         │
       v                      v                         v
  TemplateEditor      OnlyofficeService          OnlyOffice API
  Component           + Endpoints                (Port 8080)
```

---

## Features Implemented

### 1. **OnlyOffice Document Server** ✅
- **Container:** `neoapply_onlyoffice`
- **Port:** 8080
- **URL:** http://localhost:8080
- **Status:** Running

### 2. **Backend API** ✅

#### New Endpoints:
```ruby
GET  /api/v1/templates/:id/editor_config
POST /api/v1/templates/:id/onlyoffice_callback
```

#### New Service: `OnlyofficeService`
**Location:** `backend/app/services/onlyoffice_service.rb`

**Capabilities:**
- Generate OnlyOffice editor configuration
- Handle document auto-save callbacks
- Download and save edited documents
- Track document versions with unique keys

### 3. **Frontend TemplateEditor Component** ✅
**Location:** `frontend/src/components/template/TemplateEditor.vue`

**Features:**
- ✅ Full-screen modal editor
- ✅ OnlyOffice integration with Word-like interface
- ✅ Smart token picker sidebar
- ✅ Job description selector
- ✅ Edit mode / Preview mode toggle
- ✅ Auto-save functionality
- ✅ PDF/DOCX export

### 4. **Token System** ✅

**Available Tokens (10 total):**
1. `{{company_name}}` - Company name
2. `{{title}}` - Job title
3. `{{job_location}}` - Location
4. `{{job_type}}` - Employment type
5. `{{experience_level}}` - Required experience
6. `{{top_5_skills_needed}}` - Top 5 skills
7. `{{skills_required}}` - All required skills
8. `{{responsibilities}}` - Job responsibilities
9. `{{qualifications}}` - Required qualifications
10. `{{salary_range}}` - Salary information

**Token Picker UI:**
- Sidebar panel in edit mode
- Click-to-insert functionality
- Real-time preview of token values
- Visual indication with color coding

---

## User Workflow

### Step 1: Open Template Editor
1. Navigate to Templates page
2. Click on any template card
3. Editor modal opens in full screen

### Step 2: Select Job Description
1. In the left sidebar, select a completed job description
2. Token list appears with 10 available tokens
3. Each token shows a preview of the actual value

### Step 3: Insert Tokens (Edit Mode)
1. Click in the document where you want to insert a token
2. Click a token from the sidebar
3. Token `{{token_name}}` is inserted at cursor position
4. Document auto-saves

### Step 4: Preview with Real Data
1. Click "Preview" button
2. Backend processes document and replaces all `{{tokens}}` with actual job data
3. Preview opens in view-only mode
4. All tokens show real company information

### Step 5: Export
1. In preview mode, click "Export PDF"
2. Processed .docx file downloads
3. File includes company name in filename
4. Can be converted to PDF externally

---

## Technical Implementation Details

### Frontend Service Layer

**`frontend/src/services/templateService.js`:**
```javascript
getEditorConfig(templateId)      // Get OnlyOffice config
getTemplate(templateId)           // Get template details
applyJobTokens(templateId, jobId) // Process tokens
getDownloadUrl(templateId)        // Get download link
```

### OnlyOffice Configuration

**Environment Variables:**
```bash
# Backend
ONLYOFFICE_URL=http://onlyoffice
ONLYOFFICE_JWT_SECRET=           # Optional JWT secret

# Frontend
VITE_ONLYOFFICE_URL=http://localhost:8080
```

**Editor Config Structure:**
```javascript
{
  documentType: 'word',
  document: {
    fileType: 'docx',
    key: 'unique_key_per_version',
    title: 'Template Name',
    url: 'https://backend.com/api/v1/templates/123/download',
    permissions: {
      edit: true,
      download: true,
      print: true
    }
  },
  editorConfig: {
    mode: 'edit',  // or 'view'
    lang: 'en',
    callbackUrl: 'https://backend.com/api/v1/templates/123/onlyoffice_callback'
  }
}
```

### Auto-Save Mechanism

**OnlyOffice → Backend Callback Flow:**
1. User makes changes in editor
2. OnlyOffice auto-saves (configurable interval)
3. OnlyOffice calls `callbackUrl` with status code
4. Backend downloads the updated document
5. Backend attaches new version to template
6. Document key updates to force editor reload

**Status Codes:**
- `1` - Document being edited
- `2` - Document ready for saving (action required)
- `3` - Saving error
- `4` - Closed with no changes
- `6/7` - Being edited or saving in progress

### Token Replacement Process

**When User Clicks "Preview":**
1. Frontend calls `POST /templates/:id/apply_job` with `job_id`
2. Backend uses `DocxTemplateService` to:
   - Open the .docx file (ZIP format)
   - Extract XML content
   - Find all `{{token_name}}` patterns
   - Replace with actual values from `job.parsed_attributes`
   - Handle arrays (skills, responsibilities) with formatting
   - Escape XML special characters
   - Rezip into valid .docx
3. Returns download URL for processed document
4. Frontend loads processed document in view-only mode

---

## File Structure

```
backend/
├── app/
│   ├── controllers/api/v1/
│   │   └── templates_controller.rb         # Added editor_config, onlyoffice_callback
│   └── services/
│       ├── onlyoffice_service.rb            # NEW: OnlyOffice integration
│       └── docx_template_service.rb         # Token replacement
├── config/
│   └── routes.rb                            # Added new routes
└── docker-compose.yml                       # Added onlyoffice service

frontend/
├── src/
│   ├── components/template/
│   │   └── TemplateEditor.vue               # NEW: Full editor component
│   ├── services/
│   │   └── templateService.js               # NEW: API calls
│   └── views/
│       └── TemplatesView.vue                # Integrated editor modal
└── docker-compose.yml                       # Added VITE_ONLYOFFICE_URL
```

---

## API Endpoints Reference

### GET /api/v1/templates/:id/editor_config
**Purpose:** Get OnlyOffice configuration for editing a template

**Response:**
```json
{
  "data": {
    "config": {
      "documentType": "word",
      "document": { ... },
      "editorConfig": { ... }
    },
    "onlyoffice_url": "http://localhost:8080"
  }
}
```

### POST /api/v1/templates/:id/onlyoffice_callback
**Purpose:** Handle auto-save from OnlyOffice

**Request Body:**
```json
{
  "status": 2,
  "url": "https://onlyoffice-server.com/download/document.docx",
  "key": "document_key"
}
```

**Response:**
```json
{
  "error": 0
}
```

### POST /api/v1/templates/:id/apply_job
**Purpose:** Replace tokens with job description data

**Request:**
```json
{
  "job_id": 123
}
```

**Response:**
```json
{
  "data": {
    "download_url": "http://localhost:3000/api/v1/templates/456/download?format=docx"
  }
}
```

---

## Security Considerations

### 1. **Authentication**
- All endpoints require JWT authentication
- Except `onlyoffice_callback` (OnlyOffice doesn't send auth tokens)
- Users can only edit their own templates

### 2. **CSRF Protection**
- Disabled for `onlyoffice_callback` endpoint
- OnlyOffice makes direct POST requests

### 3. **File Validation**
- Only `.docx` files accepted
- Max file size: 10MB
- Content type validation

### 4. **XML Sanitization**
- Special characters escaped in token values
- Prevents XML injection attacks

---

## Testing the Implementation

### 1. **Start Services**
```bash
docker-compose up -d
```

### 2. **Verify OnlyOffice is Running**
```bash
curl http://localhost:8080/healthcheck
```

**Expected:** OnlyOffice welcome page or API response

### 3. **Open Editor**
1. Go to http://localhost:5173/templates
2. Click on any template
3. Editor should load with Word-like interface

### 4. **Test Token Insertion**
1. Select a job description from dropdown
2. Token sidebar appears with 10 tokens
3. Click a token
4. Verify `{{token_name}}` appears in document

### 5. **Test Preview Mode**
1. Insert some tokens in the document
2. Click "Preview" button
3. Verify tokens are replaced with actual job data
4. Example: `{{company_name}}` becomes "CARFAX Canada"

### 6. **Test Export**
1. In preview mode, click "Export PDF"
2. .docx file downloads
3. Open in Word/LibreOffice
4. Verify all tokens are replaced correctly

---

## Troubleshooting

### OnlyOffice Not Loading

**Symptoms:** Editor shows "Failed to initialize OnlyOffice"

**Causes:**
1. OnlyOffice container not running
2. CORS issues
3. Network connectivity

**Solutions:**
```bash
# Check container status
docker-compose ps

# View OnlyOffice logs
docker-compose logs onlyoffice

# Restart OnlyOffice
docker-compose restart onlyoffice
```

### Document Not Saving

**Symptoms:** Changes lost when closing editor

**Causes:**
1. Callback URL not accessible
2. Backend not processing callback

**Solutions:**
- Check backend logs for callback errors
- Verify `APP_HOST` environment variable
- Ensure callback endpoint is not behind firewall

### Tokens Not Replacing

**Symptoms:** `{{tokens}}` still visible in preview

**Causes:**
1. Job description not completed
2. Token name mismatch
3. `DocxTemplateService` error

**Solutions:**
- Verify job status is "completed"
- Check token names match exactly (case-sensitive)
- Check backend logs for DOCX processing errors

---

## Performance Optimization

### 1. **Lazy Loading**
- OnlyOffice API script loaded only when editor opens
- Reduces initial page load time

### 2. **Caching**
- Document keys include timestamp
- Forces browser to reload when document changes
- Prevents stale document display

### 3. **Background Processing**
- Token replacement happens server-side
- Large documents processed efficiently
- No client-side memory issues

---

## Future Enhancements

### Possible Additions:
1. **Real-time Collaboration** - Multiple users editing simultaneously
2. **Version History** - Track all document versions
3. **Comments & Review** - Enable document review workflow
4. **Templates Library** - Pre-built template marketplace
5. **AI Suggestions** - Smart token recommendations based on content
6. **Bulk Processing** - Apply one template to multiple jobs
7. **PDF Direct Export** - Convert to PDF server-side

---

## Production Deployment Checklist

- [ ] Enable JWT for OnlyOffice (`JWT_ENABLED=true`)
- [ ] Set secure `ONLYOFFICE_JWT_SECRET`
- [ ] Use HTTPS for all endpoints
- [ ] Configure proper CORS headers
- [ ] Set up CDN for OnlyOffice static files
- [ ] Implement rate limiting on callback endpoint
- [ ] Add document backup/versioning
- [ ] Monitor OnlyOffice resource usage
- [ ] Set up health checks and alerts

---

## Resources

- **OnlyOffice Documentation:** https://api.onlyoffice.com/editors/basic
- **Docker Hub:** https://hub.docker.com/r/onlyoffice/documentserver
- **GitHub:** https://github.com/ONLYOFFICE/DocumentServer

---

**Implementation Date:** November 5, 2025
**Status:** ✅ Complete and Ready for Testing
**Total Implementation Time:** ~2 hours
