# OnlyOffice Document Editor - Implementation Complete ✅

## Status: Ready for Testing

All components of the OnlyOffice Document Editor have been successfully implemented and deployed.

---

## System Status

### Services Running:
- ✅ **Frontend** (neoapply_frontend): Running on port 5173
- ✅ **Backend** (neoapply_backend): Running on port 3000
- ✅ **OnlyOffice** (neoapply_onlyoffice): Running on port 8080
- ✅ **Database** (neoapply_db): Running and healthy
- ✅ **Worker** (neoapply_worker): Running
- ✅ **Mailcatcher** (neoapply_mailcatcher): Running

### Health Checks:
- ✅ OnlyOffice: Responding to healthcheck (http://localhost:8080/healthcheck)
- ✅ Frontend: Compiled successfully without errors
- ✅ Backend: Running with OnlyOffice service loaded

---

## What Was Implemented

### 1. Backend Components

#### New Service: `OnlyofficeService`
**Location:** `backend/app/services/onlyoffice_service.rb`

**Features:**
- Generates OnlyOffice editor configuration
- Handles document callback for auto-save
- Downloads and saves updated documents
- Manages document versioning with unique keys

#### New Controller Actions
**Location:** `backend/app/controllers/api/v1/templates_controller.rb`

**Endpoints:**
- `GET /api/v1/templates/:id/editor_config` - Get editor configuration
- `POST /api/v1/templates/:id/onlyoffice_callback` - Handle auto-save callback

#### Routes Added
**Location:** `backend/config/routes.rb`
- Added `get :editor_config` and `post :onlyoffice_callback` to templates routes

### 2. Frontend Components

#### New Service: `templateService.js`
**Location:** `frontend/src/services/templateService.js`

**Methods:**
- `getEditorConfig(templateId)` - Fetch OnlyOffice config
- `getTemplate(templateId)` - Get template details
- `applyJobTokens(templateId, jobId)` - Process tokens with job data
- `getDownloadUrl(templateId)` - Get download link

#### New Component: `TemplateEditor.vue`
**Location:** `frontend/src/components/template/TemplateEditor.vue`

**Features:**
- Full-screen modal editor
- OnlyOffice embedded Word-like interface
- Token picker sidebar with 10 available tokens
- Job description selector dropdown
- Edit mode / Preview mode toggle
- Auto-save functionality (via OnlyOffice callbacks)
- Export functionality (downloads processed .docx)
- Loading states and error handling

**Available Tokens (10 total):**
1. `{{company_name}}`
2. `{{title}}`
3. `{{job_location}}`
4. `{{job_type}}`
5. `{{experience_level}}`
6. `{{top_5_skills_needed}}`
7. `{{skills_required}}`
8. `{{responsibilities}}`
9. `{{qualifications}}`
10. `{{salary_range}}`

#### Updated View: `TemplatesView.vue`
**Location:** `frontend/src/views/TemplatesView.vue`
- Integrated TemplateEditor component
- Added modal open/close functionality
- Auto-refresh on editor close

### 3. Infrastructure

#### Docker Compose Updates
**Location:** `docker-compose.yml`

**New Service Added:**
```yaml
onlyoffice:
  image: onlyoffice/documentserver:latest
  container_name: neoapply_onlyoffice
  ports:
    - "8080:80"
  environment:
    - JWT_ENABLED=false
  volumes:
    - onlyoffice_data:/var/www/onlyoffice/Data
    - onlyoffice_log:/var/log/onlyoffice
    - onlyoffice_fonts:/usr/share/fonts/truetype/custom
    - onlyoffice_forgotten:/var/lib/onlyoffice/documentserver/App_Data/cache/files/forgotten
```

**Environment Variables:**
- Backend: `ONLYOFFICE_URL=http://onlyoffice`
- Frontend: `VITE_ONLYOFFICE_URL=http://localhost:8080`

---

## User Workflow

### Step 1: Open Template Editor
1. Navigate to http://localhost:5173/templates
2. Click on any template card
3. Full-screen editor modal opens

### Step 2: Select Job Description
1. In the left sidebar, select a completed job description from dropdown
2. Token list appears with 10 available tokens
3. Each token shows a preview of the actual value from the job

### Step 3: Insert Tokens (Edit Mode)
1. Click in the document where you want to insert a token
2. Click a token from the sidebar (e.g., `{{company_name}}`)
3. Token is inserted at cursor position
4. Document auto-saves to backend via OnlyOffice callback

### Step 4: Preview with Real Data
1. Click "Preview" button in the header
2. Backend processes the document:
   - Opens .docx file (ZIP format)
   - Extracts XML content
   - Replaces all `{{tokens}}` with actual job data
   - Handles arrays (skills, responsibilities) with formatting
   - Repackages as valid .docx
3. Preview opens in view-only mode
4. All tokens now show real company information

### Step 5: Export Document
1. In preview mode, click "Export PDF" button
2. Processed .docx file downloads
3. Filename includes company name
4. File can be converted to PDF externally

---

## Technical Details

### Token Replacement Process

**Edit Mode:**
- User inserts tokens manually as `{{token_name}}`
- Tokens are plain text in the document
- OnlyOffice auto-saves changes to backend

**Preview Mode:**
- Frontend calls: `POST /api/v1/templates/:id/apply_job` with `job_id`
- Backend uses `DocxTemplateService`:
  - Opens .docx (ZIP format)
  - Parses XML content
  - Finds all `{{token_name}}` patterns using regex
  - Replaces with actual values from `job.parsed_attributes`
  - Handles special cases:
    - Arrays: Formats as bulleted/numbered lists
    - Objects: Extracts relevant fields
    - Escapes XML special characters
  - Repackages as valid .docx
- Returns download URL for processed document
- Frontend loads processed document in view-only mode

### Auto-Save Mechanism

**Flow:**
1. User makes changes in OnlyOffice editor
2. OnlyOffice auto-saves (configurable interval, default ~5 seconds)
3. OnlyOffice sends callback to: `POST /api/v1/templates/:id/onlyoffice_callback`
4. Backend receives callback with status code:
   - Status 1: Document being edited (no action)
   - Status 2: Document ready for saving (download and save)
   - Status 3: Saving error (log error)
   - Status 4: Closed with no changes (no action)
   - Status 6/7: Saving in progress (no action)
5. If status 2, backend:
   - Downloads updated document from OnlyOffice URL
   - Saves to ActiveStorage
   - Updates template timestamp (changes document key)
   - Returns success response

### Document Versioning

**Document Key Strategy:**
```ruby
def document_key(template)
  "#{template.id}_#{template.updated_at.to_i}"
end
```

- Each document version has unique key: `{template_id}_{timestamp}`
- When document is saved, timestamp updates
- New key forces OnlyOffice to reload document
- Prevents stale document caching

---

## Security Features

### 1. Authentication
- All endpoints require JWT authentication via Devise-JWT
- Exception: `onlyoffice_callback` (OnlyOffice doesn't send auth tokens)
- Users can only access their own templates

### 2. CSRF Protection
- Disabled for `onlyoffice_callback` endpoint
- OnlyOffice makes direct POST requests without CSRF tokens

### 3. File Validation
- Only `.docx` files accepted
- Max file size: 10MB (configurable in ActiveStorage)
- Content type validation on upload

### 4. XML Sanitization
- Special characters escaped in token values
- Prevents XML injection attacks in .docx files
- Implemented in `DocxTemplateService`

---

## Testing Guide

### 1. Verify Services Are Running
```bash
docker-compose ps
```
All services should show "Up" status.

### 2. Test OnlyOffice Health
```bash
curl http://localhost:8080/healthcheck
```
Expected: `true`

### 3. Test Editor Loading
1. Open browser: http://localhost:5173/templates
2. Login if needed
3. Click on any template
4. Editor should load with Word-like interface
5. Check browser console for any errors

### 4. Test Token Insertion
1. In editor, select a job description
2. Token sidebar should populate with 10 tokens
3. Click a token (e.g., `{{company_name}}`)
4. Verify token appears in document as text

### 5. Test Preview Mode
1. Insert several tokens in the document
2. Click "Preview" button
3. Wait for processing (1-3 seconds)
4. Verify tokens are replaced with actual data
5. Example: `{{company_name}}` becomes "CARFAX Canada"

### 6. Test Export
1. In preview mode, click "Export PDF"
2. .docx file should download
3. Open in Word/LibreOffice
4. Verify all tokens are replaced correctly
5. Check formatting is preserved

### 7. Test Auto-Save
1. Make changes in edit mode
2. Wait 5-10 seconds
3. Close editor modal
4. Reopen same template
5. Verify changes were saved

---

## Troubleshooting

### Issue: OnlyOffice Not Loading

**Symptoms:** Editor shows "Failed to initialize OnlyOffice"

**Solutions:**
```bash
# Check OnlyOffice container status
docker-compose ps onlyoffice

# View OnlyOffice logs
docker-compose logs onlyoffice --tail=50

# Restart OnlyOffice
docker-compose restart onlyoffice

# Verify health
curl http://localhost:8080/healthcheck
```

### Issue: Document Not Saving

**Symptoms:** Changes lost when closing editor

**Possible Causes:**
1. Callback URL not accessible from OnlyOffice container
2. Backend not processing callback correctly

**Solutions:**
```bash
# Check backend logs for callback errors
docker-compose logs backend | grep -i "onlyoffice_callback"

# Verify APP_HOST environment variable
docker-compose exec backend env | grep APP_HOST

# Test callback manually
curl -X POST http://localhost:3000/api/v1/templates/1/onlyoffice_callback \
  -H "Content-Type: application/json" \
  -d '{"status": 1}'
```

### Issue: Tokens Not Replacing

**Symptoms:** `{{tokens}}` still visible in preview

**Possible Causes:**
1. Job description not completed
2. Token name mismatch
3. DocxTemplateService error

**Solutions:**
```bash
# Check job description status
curl http://localhost:3000/api/v1/job_descriptions/{id} \
  -H "Authorization: Bearer {token}"

# Check backend logs for DOCX processing errors
docker-compose logs backend | grep -i "docx"

# Verify token names match exactly (case-sensitive)
# Compare token keys in sidebar with template content
```

### Issue: Frontend Compilation Errors

**Symptoms:** Vue parsing errors in console

**Solutions:**
```bash
# Restart frontend to clear cache
docker-compose restart frontend

# Check for syntax errors
docker-compose logs frontend | grep -i "error"

# If needed, rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

---

## API Reference

### GET /api/v1/templates/:id/editor_config

**Description:** Get OnlyOffice editor configuration

**Authentication:** Required (JWT)

**Response:**
```json
{
  "data": {
    "config": {
      "documentType": "word",
      "document": {
        "fileType": "docx",
        "key": "1_1699123456",
        "title": "Template Name",
        "url": "http://localhost:3000/api/v1/templates/1/download",
        "permissions": {
          "edit": true,
          "download": true,
          "print": true,
          "review": true
        }
      },
      "editorConfig": {
        "mode": "edit",
        "lang": "en",
        "callbackUrl": "http://localhost:3000/api/v1/templates/1/onlyoffice_callback",
        "user": {
          "id": "1",
          "name": "user@example.com"
        },
        "customization": {
          "autosave": true,
          "forcesave": true,
          "comments": false,
          "chat": false
        }
      },
      "type": "desktop"
    },
    "onlyoffice_url": "http://localhost:8080"
  }
}
```

### POST /api/v1/templates/:id/onlyoffice_callback

**Description:** Handle auto-save callback from OnlyOffice

**Authentication:** None (OnlyOffice doesn't send auth)

**Request Body:**
```json
{
  "status": 2,
  "url": "https://onlyoffice-temp.com/download/document.docx",
  "key": "1_1699123456"
}
```

**Response:**
```json
{
  "error": 0
}
```

**Status Codes:**
- 1: Document being edited
- 2: Document ready for saving
- 3: Document saving error
- 4: Closed with no changes
- 6/7: Being edited or saving in progress

### POST /api/v1/templates/:id/apply_job

**Description:** Replace tokens with job description data

**Authentication:** Required (JWT)

**Request Body:**
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

## Files Changed

### Backend Files:
1. ✅ `backend/app/services/onlyoffice_service.rb` (NEW)
2. ✅ `backend/app/controllers/api/v1/templates_controller.rb` (MODIFIED)
3. ✅ `backend/config/routes.rb` (MODIFIED)
4. ✅ `docker-compose.yml` (MODIFIED - added onlyoffice service)

### Frontend Files:
1. ✅ `frontend/src/services/templateService.js` (NEW)
2. ✅ `frontend/src/components/template/TemplateEditor.vue` (NEW)
3. ✅ `frontend/src/views/TemplatesView.vue` (MODIFIED)
4. ✅ `docker-compose.yml` (MODIFIED - added VITE_ONLYOFFICE_URL)

### Documentation:
1. ✅ `ONLYOFFICE_EDITOR_IMPLEMENTATION.md` (NEW - comprehensive guide)
2. ✅ `ONLYOFFICE_SETUP_COMPLETE.md` (NEW - this file)

---

## Next Steps

### Immediate Testing:
1. ✅ Verify all services are running
2. ⏳ Test editor loading in browser
3. ⏳ Test token insertion workflow
4. ⏳ Test preview mode with real data
5. ⏳ Test export functionality
6. ⏳ Test auto-save mechanism

### Future Enhancements (Optional):
1. **Smart Autocomplete** - Google-like dropdown when typing token names
2. **Token Buttons** - Show tokens as removable button chips instead of plain text
3. **Real-time Collaboration** - Multiple users editing simultaneously
4. **Version History** - Track all document versions with restore functionality
5. **Comments & Review** - Enable document review workflow
6. **Direct PDF Export** - Server-side PDF conversion (requires LibreOffice)
7. **Template Library** - Pre-built templates marketplace
8. **AI Suggestions** - Smart token recommendations based on content
9. **Bulk Processing** - Apply one template to multiple jobs

---

## Production Deployment Checklist

Before deploying to production, ensure:

- [ ] Enable JWT for OnlyOffice (`JWT_ENABLED=true`)
- [ ] Set secure `ONLYOFFICE_JWT_SECRET` (min 32 characters)
- [ ] Use HTTPS for all endpoints
- [ ] Configure proper CORS headers
- [ ] Set up CDN for OnlyOffice static files
- [ ] Implement rate limiting on callback endpoint
- [ ] Add document backup/versioning system
- [ ] Monitor OnlyOffice resource usage
- [ ] Set up health checks and alerts
- [ ] Configure firewall rules for callback access
- [ ] Set proper `APP_HOST` for callback URL
- [ ] Test callback accessibility from OnlyOffice container
- [ ] Configure ActiveStorage for cloud storage (S3/GCS)
- [ ] Set up document retention policies
- [ ] Enable OnlyOffice logging and monitoring

---

## Resources

- **OnlyOffice Documentation:** https://api.onlyoffice.com/editors/basic
- **Docker Hub:** https://hub.docker.com/r/onlyoffice/documentserver
- **GitHub:** https://github.com/ONLYOFFICE/DocumentServer
- **API Reference:** https://api.onlyoffice.com/editors/config/
- **Callback Documentation:** https://api.onlyoffice.com/editors/callback

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review logs: `docker-compose logs [service]`
3. Check OnlyOffice documentation
4. Review browser console for frontend errors
5. Check backend logs for API errors

---

**Implementation Date:** November 5, 2025
**Status:** ✅ Complete and Ready for Testing
**Total Implementation Time:** ~2 hours
**Services:** 6 containers running successfully
**Tests Passed:** All health checks passing
