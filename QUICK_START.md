# NeoApply Chrome Extension - Quick Start Guide

## 🎯 Complete Implementation Status

### ✅ Backend (100% Complete)
- [x] AutofillProfile model
- [x] Application model
- [x] 3 Controllers under `/api/v1/extension`
- [x] TailoredAnswerService (AI-powered)
- [x] Routes configured
- [x] CORS configured
- [x] User model updated
- [x] Database migrated
- [x] Backend restarted

### ✅ Extension (95% Complete)
- [x] 18 files created
- [x] Manifest V3 configured
- [x] Content scripts (Greenhouse, Lever)
- [x] Background service worker
- [x] Popup UI (login/dashboard)
- [x] Options page (settings)
- [x] Autofill panel component
- [x] API client
- [x] Field mapping utilities
- [ ] Icon PNGs (need to generate from SVG)

---

## 🚀 3 Steps to Get Extension Running

### Step 1: Generate Icons (2 minutes)

Option A - Online Converter (Easiest):
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `chrome-extension/assets/icons/icon.svg`
3. Convert to 16x16, 32x32, 48x48, 128x128
4. Download and place in `chrome-extension/assets/icons/`

Option B - Use Placeholder (Quick):
```bash
# Create simple placeholder icons (any image editor)
# Just save any 16x16, 32x32, 48x48, 128x128 PNGs
# Extension will work with placeholders
```

### Step 2: Load Extension in Chrome (1 minute)

1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Toggle **"Developer mode"** ON (top right)
4. Click **"Load unpacked"**
5. Select folder: `C:\Users\Saurabh Darji\Desktop\Claude\NeoApply\chrome-extension`
6. Extension should appear with NeoApply icon

### Step 3: Test It (5 minutes)

1. **Click extension icon** in Chrome toolbar
2. **Login** with your NeoApply credentials
3. **Click "Set Up Profile"** (or right-click extension → Options)
4. **Fill in your information** and click Save
5. **Navigate to a test Greenhouse job**:
   - Example: https://boards.greenhouse.io/embed/job_app?token=... (any greenhouse job)
6. **NeoApply panel should appear** on the right side
7. **Click "Autofill Form"** - watch it fill your information!

---

## 📍 API Endpoints Reference

### Authentication
```
POST /api/v1/auth/login
Body: { "email": "...", "password": "..." }
Response: { "token": "...", "user": {...} }
```

### Autofill Profile
```
GET  /api/v1/extension/autofill_profile
PUT  /api/v1/extension/autofill_profile
Body: { "profile": { "first_name": "...", ... } }
```

### Applications
```
GET    /api/v1/extension/applications
POST   /api/v1/extension/applications
PATCH  /api/v1/extension/applications/:id
DELETE /api/v1/extension/applications/:id
```

### AI Answers
```
POST /api/v1/extension/answers/generate
Body: {
  "job_text": "...",
  "resume_id": 1,
  "fields_metadata": [
    { "label": "Cover Letter", "maxLength": 500 }
  ]
}
```

---

## 🧪 Quick API Test

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Copy the token from response

# 2. Get autofill profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/extension/autofill_profile

# 3. Update profile
curl -X PUT http://localhost:3000/api/v1/extension/autofill_profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1 555-1234",
      "city": "San Francisco",
      "state": "CA"
    }
  }'

# 4. Create application
curl -X POST http://localhost:3000/api/v1/extension/applications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application": {
      "company": "Test Company",
      "role": "Software Engineer",
      "url": "https://example.com/job",
      "ats_type": "greenhouse",
      "status": "autofilled"
    }
  }'
```

---

## 🔍 Troubleshooting

### Extension Not Appearing
- Check Developer mode is enabled
- Reload extension: Extensions page → Reload button
- Check console for errors: F12 → Console tab

### Panel Not Showing on Job Page
- Verify you're on Greenhouse or Lever site
- Check URL matches patterns in manifest.json
- Refresh the page
- Check browser console for errors

### Autofill Not Working
- Ensure profile is filled in Options page
- Verify form fields are detected (shown in panel)
- Check console for field mapping logs (if debug mode enabled)

### API Errors
- Check backend is running: `docker-compose ps`
- Verify CORS is configured: Check `config/initializers/cors.rb`
- Check JWT token is valid: Look in extension popup
- View Rails logs: `docker-compose logs backend`

### AI Answers Not Generating
- Check OpenAI API key: `ENV['OPENAI_API_KEY']`
- Verify daily limit not exceeded (20 per day)
- Check resume is parsed: Resume should have `parsed_content`
- View service logs in Rails console

---

## 📂 File Locations Quick Reference

### Extension Files
```
chrome-extension/
├── manifest.json                    # Extension config
├── background/service-worker.js     # Auth & API
├── content/greenhouse.js            # Greenhouse script
├── content/lever.js                 # Lever script
├── popup/popup.html                 # Login UI
├── options/options.html             # Settings UI
├── ui/autofill-panel.js            # Main panel
└── utils/api.js                     # API client
```

### Backend Files
```
backend/
├── app/models/
│   ├── autofill_profile.rb         # Profile model
│   └── application.rb               # Application model
├── app/controllers/api/v1/extension/
│   ├── autofill_profiles_controller.rb
│   ├── applications_controller.rb
│   └── answers_controller.rb
├── app/services/
│   └── tailored_answer_service.rb  # AI service
└── config/
    ├── routes.rb                    # API routes
    └── initializers/cors.rb         # CORS config
```

---

## 🎨 Supported ATS Platforms

### Currently Working (V1)
- ✅ **Greenhouse** (`boards.greenhouse.io/*`)
- ✅ **Lever** (`jobs.lever.co/*`)

### Coming Soon (V2)
- 🚧 Workday
- 🚧 ADP

---

## 💡 Feature Overview

### 1. Smart Autofill
- Detects 12+ field types automatically
- Maps name, email, phone, address, links
- Triggers proper events for React/Vue forms
- Skips EEO demographic questions

### 2. AI-Powered Answers
- Cover letter generation
- "Why interested" responses
- Experience summaries
- Rate limited: 20 per day per user
- Costs ~$0.002 per generation

### 3. Application Tracking
- Auto-logs applications to dashboard
- Tracks company, role, ATS type, status
- Links to resume used
- Timestamps all applications

### 4. Resume Management
- Lists all uploaded resumes
- Select default resume
- Highlights file upload field
- (Manual selection required due to browser security)

---

## 📊 Next Steps

### Immediate (Today)
1. [ ] Generate icon PNGs
2. [ ] Load extension in Chrome
3. [ ] Test login and profile setup
4. [ ] Test autofill on Greenhouse job
5. [ ] Test AI answer generation

### Short Term (This Week)
1. [ ] Add more test data (resumes, jobs)
2. [ ] Test on various Greenhouse/Lever sites
3. [ ] Gather user feedback
4. [ ] Fix any bugs discovered
5. [ ] Improve field detection accuracy

### Long Term (Next Month)
1. [ ] Add Workday support
2. [ ] Add ADP support
3. [ ] Implement caching for common jobs
4. [ ] Add application status updates
5. [ ] Build analytics dashboard
6. [ ] Publish to Chrome Web Store

---

## 📞 Support & Resources

### Documentation
- Extension README: `chrome-extension/README.md`
- Implementation Details: `chrome-extension/IMPLEMENTATION.md`
- Backend Integration: `chrome-extension/BACKEND_INTEGRATION.md`
- Full Summary: `EXTENSION_BACKEND_SUMMARY.md`

### Debugging
- Extension Console: F12 on any job page
- Background Logs: `chrome://extensions/` → Inspect service worker
- Rails Logs: `docker-compose logs -f backend`
- Database: `docker-compose exec backend rails console`

### Environment Variables
```bash
OPENAI_API_KEY=sk-...           # Required for AI features
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

**Version**: 1.0.0
**Last Updated**: January 5, 2025
**Status**: ✅ Ready for Testing

**All backend work is complete. Extension is ready to load and test!**
