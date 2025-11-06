# NeoApply Chrome Extension

Autofill job applications with your resume data and AI-powered tailored answers.

## Features

- **Smart Autofill**: Automatically fill job application forms with your personal information
- **ATS Detection**: Supports Greenhouse and Lever (Workday and ADP coming soon)
- **AI-Powered Answers**: Generate tailored cover letters and answers based on job descriptions
- **Resume Management**: Select and attach the right resume for each application
- **Application Tracking**: Automatically log applications to your NeoApply dashboard

## Installation

### Development Mode

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `chrome-extension` directory
5. The extension should now appear in your extensions list

### Production Build

Coming soon - extension will be available on the Chrome Web Store.

## Setup

### 1. Login

Click the NeoApply extension icon in your toolbar and log in with your NeoApply credentials.

### 2. Configure Autofill Profile

1. Right-click the extension icon and select "Options"
2. Fill in your personal information (name, email, phone, address, links)
3. Click "Save Profile"

### 3. Upload Resumes

Upload your resumes through the NeoApply web application. They will automatically sync to the extension.

### 4. Select Default Resume

In the extension options page, select which resume to use by default for applications.

## Usage

### Autofilling a Form

1. Navigate to a supported job application page (Greenhouse or Lever)
2. The NeoApply panel will automatically appear on the right side of the page
3. Click "Autofill Form" to fill in your information
4. Review and adjust as needed

### Generating Tailored Answers

1. On a job application page, click "Get Tailored Answers" in the NeoApply panel
2. The extension will extract the job description and send it to the AI
3. Suggested answers will appear for cover letter and other text fields
4. Click "Insert" to add the suggestion to the form

### Attaching Your Resume

1. Click "Prepare Resume Attachment" in the panel
2. The file upload field will be highlighted
3. Click it and select your resume from the download location

**Note**: Due to browser security restrictions, extensions cannot automatically attach files. You must manually select the file.

## Supported Platforms

### Currently Supported (V1)

- ✅ **Greenhouse** (`boards.greenhouse.io`, `*.greenhouse.io`)
- ✅ **Lever** (`jobs.lever.co`, `*.lever.co`)

### Coming Soon (V2)

- 🚧 **Workday**
- 🚧 **ADP**

## Architecture

```
chrome-extension/
├── manifest.json           # Extension configuration
├── background/
│   └── service-worker.js   # Background service worker for API calls
├── content/
│   ├── greenhouse.js       # Greenhouse content script
│   └── lever.js            # Lever content script
├── popup/
│   ├── popup.html          # Extension popup UI
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup logic
├── options/
│   ├── options.html        # Options page UI
│   ├── options.css         # Options styles
│   └── options.js          # Options logic
├── ui/
│   ├── panel.css           # In-page panel styles
│   └── autofill-panel.js   # Autofill panel component
└── utils/
    ├── config.js           # Configuration
    ├── storage.js          # Chrome storage utilities
    ├── api.js              # API client
    └── field-mapper.js     # Field detection and mapping
```

## Development

### Prerequisites

- Chrome browser
- NeoApply backend running locally or access to production API

### Configuration

Edit `utils/config.js` to set the API base URL:

```javascript
const ENV = 'development'; // or 'production'
```

For local development, ensure the backend is running at `http://localhost:3000`.

### Debugging

1. Enable debug mode in the extension options page
2. Open Chrome DevTools (F12) on any supported job application page
3. Check the console for detailed logs prefixed with `[NeoApply]`

### Testing

To test the extension:

1. Navigate to a Greenhouse test job:
   - Example: `https://boards.greenhouse.io/example/jobs/123456`
2. Or a Lever test job:
   - Example: `https://jobs.lever.co/example/job-id`
3. The NeoApply panel should appear automatically
4. Test autofill, tailored answers, and resume attachment features

## Privacy & Security

- **Authentication**: Uses JWT tokens stored securely in Chrome's local storage
- **Data Collection**: Only collects data you explicitly provide in your autofill profile
- **No Tracking**: No analytics or tracking outside of supported ATS domains
- **Server Communication**: Only communicates with the NeoApply backend API

## Permissions

The extension requires the following permissions:

- `storage`: Store autofill profile and settings
- `activeTab`: Access job application pages
- `scripting`: Inject autofill functionality
- `downloads`: Assist with resume downloads
- `host_permissions`: Access Greenhouse and Lever domains

## Troubleshooting

### Panel Not Appearing

1. Check that the extension is enabled in `chrome://extensions/`
2. Verify you're on a supported ATS platform
3. Refresh the page (F5)
4. Check the browser console for errors

### Autofill Not Working

1. Ensure your autofill profile is complete in the options page
2. Try clicking "Load from Server" to sync your profile
3. Check that the form fields are detected (shown in the panel)

### Authentication Issues

1. Log out and log back in through the extension popup
2. Clear extension storage: `chrome://extensions/` → NeoApply → "Clear storage"
3. Ensure the NeoApply backend is accessible

### Resume Upload Issues

Remember that browser security prevents automatic file uploads. You must:
1. Click "Prepare Resume Attachment" to highlight the field
2. Manually click the highlighted file input
3. Select your resume file

## Backend Integration

The extension requires the following backend API endpoints:

### Auth
- `POST /api/v1/auth/login` - Login with email/password
- `DELETE /api/v1/auth/logout` - Logout

### Autofill Profile
- `GET /api/v1/autofill_profile` - Get autofill profile
- `PUT /api/v1/autofill_profile` - Update autofill profile

### Resumes
- `GET /api/v1/resumes` - List user's resumes
- `GET /api/v1/resumes/:id` - Get resume details
- `GET /api/v1/resumes/:id/download` - Download resume PDF

### Applications
- `POST /api/v1/applications` - Create application record
- `PATCH /api/v1/applications/:id` - Update application
- `GET /api/v1/applications` - List applications

### AI Answers
- `POST /api/v1/answers/generate` - Generate tailored answers

See the main project README for backend setup instructions.

## Contributing

This extension is part of the NeoApply project. For contribution guidelines, see the main project repository.

## License

Copyright © 2025 NeoApply. All rights reserved.

## Support

For support, please contact:
- Email: support@neoapply.com
- GitHub Issues: [neoapply/issues](https://github.com/neoapply/neoapply/issues)

---

**Version**: 1.0.0
**Last Updated**: 2025-01-05
