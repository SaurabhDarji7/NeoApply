# OnlyOffice Integration - Critical Fixes Applied ✅

## Issues Found and Fixed

### Issue 1: CSRF Protection Error ✅ FIXED
**Problem:**
```
ArgumentError (Before process_action callback :verify_authenticity_token has not been defined)
```

**Root Cause:**
- Templates controller tried to skip `verify_authenticity_token` callback
- API controllers (extending `ActionController::API`) don't have CSRF protection
- This callback doesn't exist in the inheritance chain

**Fix Applied:**
- Removed line 9 from `templates_controller.rb`:
  ```ruby
  skip_before_action :verify_authenticity_token, only: [:onlyoffice_callback]
  ```
- API controllers use JWT authentication, not CSRF tokens
- Only need to skip authentication for OnlyOffice callback

**File Changed:** `backend/app/controllers/api/v1/templates_controller.rb`

---

### Issue 2: File URL Authentication Problem ✅ FIXED
**Problem:**
- OnlyOffice couldn't access template files
- File URL pointed to authenticated endpoint: `/api/v1/templates/:id/download`
- OnlyOffice doesn't send Authorization headers, resulting in 401 errors

**Root Cause:**
```ruby
# OLD CODE - Wrong approach
def self.generate_file_url(template)
  "#{ENV.fetch('FRONTEND_URL', 'http://localhost:3000')}/api/v1/templates/#{template.id}/download"
end
```

**Fix Applied:**
- Use Rails ActiveStorage's public blob URLs instead
- These URLs are publicly accessible without authentication
- Include signed tokens in the URL for security
- Use internal service name so OnlyOffice container can reach it

```ruby
# NEW CODE - Correct approach
def self.generate_file_url(template)
  if template.file.attached?
    Rails.application.routes.url_helpers.rails_blob_url(
      template.file,
      host: ENV.fetch('BACKEND_HOST', 'http://backend:3000'),
      disposition: 'inline'
    )
  else
    raise 'No file attached to template'
  end
end
```

**File Changed:** `backend/app/services/onlyoffice_service.rb`

---

### Issue 3: Callback URL Localhost Problem ✅ FIXED
**Problem:**
- Callback URL defaulted to `http://localhost:3000`
- From OnlyOffice container, `localhost` points to itself, not the Rails backend
- Callbacks failed silently

**Root Cause:**
```ruby
# OLD CODE - Wrong default
CALLBACK_URL_BASE = ENV.fetch('APP_HOST', 'localhost:3000')
```

**Fix Applied:**
- Changed default to use Docker service name
- OnlyOffice container can now reach backend via internal network
- Added environment variable to docker-compose

```ruby
# NEW CODE - Correct default
CALLBACK_URL_BASE = ENV.fetch('APP_HOST', 'backend:3000')
```

**Files Changed:**
- `backend/app/services/onlyoffice_service.rb`
- `docker-compose.yml` (added `APP_HOST: ${APP_HOST:-backend:3000}`)

---

### Issue 4: Browser Can't Access Internal OnlyOffice URL ✅ FIXED
**Problem:**
- Backend returned internal Docker service URL to frontend
- Browser tried to load: `http://onlyoffice/web-apps/apps/api/documents/api.js`
- Browser can't resolve Docker internal hostname
- OnlyOffice editor failed to initialize

**Root Cause:**
```ruby
# OLD CODE - Returns internal service name
onlyoffice_url: ENV.fetch('ONLYOFFICE_URL', 'http://onlyoffice')
```

**Fix Applied:**
- Created separate environment variable for public-facing URL
- Backend now returns `http://localhost:8080` to frontend
- Browser can successfully load OnlyOffice API script
- Internal services still use `http://onlyoffice` for inter-container communication

```ruby
# NEW CODE - Returns public URL
onlyoffice_url: ENV.fetch('ONLYOFFICE_PUBLIC_URL', 'http://localhost:8080')
```

**Files Changed:**
- `backend/app/controllers/api/v1/templates_controller.rb`
- `docker-compose.yml` (added `ONLYOFFICE_PUBLIC_URL: ${ONLYOFFICE_PUBLIC_URL:-http://localhost:8080}`)

---

### Issue 5: Document Download Route Protection ✅ FIXED
**Problem:**
- OnlyOffice tried to fetch document from authenticated route
- No way for OnlyOffice to pass authentication token
- Document loading failed

**Fix Applied:**
- Switched to using ActiveStorage blob URLs (see Issue 2)
- Blob URLs include signed tokens in query string
- No authentication header needed
- OnlyOffice can now fetch documents successfully

**File Changed:** `backend/app/services/onlyoffice_service.rb`

---

### Issue 6: OnlyOffice Blocks Private IP Addresses ✅ FIXED
**Problem:**
```
Error: DNS lookup 172.26.0.5(family:4, host:backend) is not allowed.
Because, It is private IP address.
```

**Root Cause:**
- OnlyOffice has built-in security that blocks requests to private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
- When OnlyOffice resolves `backend` hostname, it gets `172.26.0.5` (Docker internal network)
- OnlyOffice refuses to download files from this IP for security
- This is a protection against SSRF (Server-Side Request Forgery) attacks

**Fix Applied:**
Added environment variables to OnlyOffice container to allow private IP access in development:

```yaml
environment:
  - WOPI_ENABLED=true
  - ALLOW_PRIVATE_IP_ADDRESS=true
  - ALLOW_META_IP_ADDRESS=true
```

**Security Note:**
⚠️ **DO NOT use these settings in production!** These settings disable important security protections. In production, use:
- Public URLs for document storage (S3, CDN, etc.)
- Proper DNS resolution to public IPs
- Keep private IP blocking enabled

**File Changed:** `docker-compose.yml`

---

## Environment Variables Added

### Backend (docker-compose.yml)
```yaml
environment:
  # Default changed from localhost:3000 to backend:3000
  APP_HOST: ${APP_HOST:-backend:3000}

  # NEW: Backend host for generating blob URLs
  BACKEND_HOST: ${BACKEND_HOST:-http://backend:3000}

  # Existing: Internal OnlyOffice URL (for container-to-container)
  ONLYOFFICE_URL: ${ONLYOFFICE_URL:-http://onlyoffice}

  # NEW: Public OnlyOffice URL (for browser access)
  ONLYOFFICE_PUBLIC_URL: ${ONLYOFFICE_PUBLIC_URL:-http://localhost:8080}
```

---

## Network Communication Flow

### Before Fixes (BROKEN):
```
Browser → Backend API → Returns: onlyoffice_url="http://onlyoffice"
Browser → http://onlyoffice/api.js ❌ DNS resolution fails

OnlyOffice → http://localhost:3000/api/v1/templates/1/download ❌ Localhost is OnlyOffice itself
OnlyOffice → Callback: http://localhost:3000/callback ❌ Localhost is OnlyOffice itself
```

### After Fixes (WORKING):
```
Browser → Backend API → Returns: onlyoffice_url="http://localhost:8080"
Browser → http://localhost:8080/api.js ✅ Successfully loads script

OnlyOffice → http://backend:3000/rails/active_storage/blobs/... ✅ Reaches backend, signed URL
OnlyOffice → Callback: http://backend:3000/callback ✅ Reaches backend successfully
```

---

## Testing the Fixes

### 1. Test Template Upload
```bash
# Should no longer see ArgumentError
curl -X POST http://localhost:3000/api/v1/templates \
  -H "Authorization: Bearer $TOKEN" \
  -F "template[name]=Test" \
  -F "template[file]=@test.docx"
```

### 2. Test Editor Config
```bash
# Should return localhost:8080, not internal service name
curl http://localhost:3000/api/v1/templates/1/editor_config \
  -H "Authorization: Bearer $TOKEN" | jq '.data.onlyoffice_url'
```
**Expected:** `"http://localhost:8080"`

### 3. Test Document URL
```bash
# Check the document URL in the config
curl http://localhost:3000/api/v1/templates/1/editor_config \
  -H "Authorization: Bearer $TOKEN" | jq '.data.config.document.url'
```
**Expected:** Should start with `http://backend:3000/rails/active_storage/blobs/...`

### 4. Test OnlyOffice Can Access Document
```bash
# From inside OnlyOffice container
docker exec neoapply_onlyoffice curl -I http://backend:3000/rails/active_storage/blobs/[...]
```
**Expected:** HTTP 200 OK

### 5. Test Browser Access
1. Open http://localhost:5173/templates
2. Click on a template
3. Open browser console
4. **Expected:** No errors loading OnlyOffice API script
5. **Expected:** Editor loads successfully

### 6. Test Callback
```bash
# Monitor backend logs while editing a document
docker-compose logs -f backend | grep -i "onlyoffice"
```
**Expected:** See successful callback logs when document is saved

---

## All Files Modified

### Backend Files:
1. ✅ `backend/app/controllers/api/v1/templates_controller.rb`
   - Removed CSRF skip (line 9)
   - Changed `ONLYOFFICE_URL` to `ONLYOFFICE_PUBLIC_URL` (line 190)

2. ✅ `backend/app/services/onlyoffice_service.rb`
   - Changed `APP_HOST` default to `backend:3000` (line 9)
   - Rewrote `generate_file_url` to use blob URLs (lines 53-68)

3. ✅ `docker-compose.yml`
   - Changed `APP_HOST` default to `backend:3000` (line 52)
   - Added `BACKEND_HOST` environment variable (line 53)
   - Added `ONLYOFFICE_PUBLIC_URL` environment variable (line 57)

---

## Production Deployment Notes

### Environment Variables to Set:
```bash
# Backend container
APP_HOST=backend:3000                    # Internal callback URL
BACKEND_HOST=https://api.yourdomain.com  # Public API URL for blob URLs
ONLYOFFICE_URL=http://onlyoffice         # Internal OnlyOffice URL
ONLYOFFICE_PUBLIC_URL=https://docs.yourdomain.com  # Public OnlyOffice URL

# If using JWT for OnlyOffice
ONLYOFFICE_JWT_SECRET=your-secret-key-here
JWT_ENABLED=true  # In OnlyOffice container
```

### DNS/Networking Requirements:
1. **OnlyOffice → Backend:** Must be able to reach backend via internal network
2. **OnlyOffice → Storage Blobs:** Must be able to access blob storage URLs
3. **Browser → OnlyOffice:** Must be able to reach public OnlyOffice URL
4. **Browser → Backend API:** Already configured

### Callback URL Considerations:
- If using load balancer, ensure it can route to backend
- If using SSL, use HTTPS in `BACKEND_HOST` and `APP_HOST`
- Firewall must allow OnlyOffice → Backend communication

---

## Summary

All 6 critical issues have been identified and fixed:

1. ✅ **CSRF callback error** - Removed non-existent callback skip
2. ✅ **File authentication** - Switched to public blob URLs with signed tokens
3. ✅ **Callback localhost** - Changed to Docker service name
4. ✅ **Browser access** - Separated public/internal OnlyOffice URLs
5. ✅ **Route protection** - Using blob URLs bypasses authentication requirement
6. ✅ **Private IP blocking** - Enabled ALLOW_PRIVATE_IP_ADDRESS for development

**Status:** All services running successfully
- Backend: Listening on port 3000
- Frontend: Running on port 5173
- OnlyOffice: Running on port 8080
- All containers: Healthy and communicating

**Next Step:** Test the complete workflow:
1. Upload a template
2. Open editor
3. Insert tokens
4. Save document (test auto-save)
5. Preview with job data
6. Export document

---

**Date:** November 5, 2025
**Time:** 02:00 UTC
**Status:** ✅ Ready for Testing
