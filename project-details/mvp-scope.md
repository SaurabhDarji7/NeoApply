# NeoApply - MVP Scope (Phase 1)

## Overview
The MVP focuses on the core foundation: **user management, resume parsing, and job description parsing**. This establishes the intelligent data layer that future features will build upon.

---

## Phase 1 Goals

### Primary Objectives
1. Users can create accounts and authenticate
2. Users can upload resumes in multiple formats (PDF, DOCX, TXT)
3. System parses resumes into structured JSON data
4. Users can input job description URLs
5. System scrapes and parses job descriptions into structured attributes
6. Users can view parsed data in a clean dashboard

### Non-Goals (Future Phases)
- Gmail automation
- LinkedIn automation
- Automated job applications
- Resume customization/templating
- Recruiter discovery
- Email/LinkedIn message templates
- Multi-job application management

---

## Feature Breakdown

### 1. User Authentication & Profile Management

#### User Stories
- As a user, I want to register with email/password so I can create an account
- As a user, I want to log in securely so I can access my data
- As a user, I want to log out to protect my privacy
- As a user, I want to view my profile information

#### Technical Requirements
- **Backend**: Devise + Devise-JWT for authentication
- **Frontend**: Login/Register forms with validation
- **Security**: JWT tokens stored in localStorage
- **Validation**:
  - Email format validation
  - Password strength (min 8 chars, at least 1 number)
  - Unique email constraint

#### API Endpoints
```
POST   /api/v1/auth/register     - Create account
POST   /api/v1/auth/login        - Get JWT token
DELETE /api/v1/auth/logout       - Invalidate token
GET    /api/v1/users/me          - Get current user info
PUT    /api/v1/users/me          - Update profile
```

#### UI Components
- Registration form
- Login form
- User profile page
- Navigation bar with logout button

---

### 2. Resume Upload & Storage

#### User Stories
- As a user, I want to upload my resume in PDF, DOCX, or TXT format
- As a user, I want to see all my uploaded resumes
- As a user, I want to download my original resume file
- As a user, I want to delete old resumes

#### Technical Requirements
- **File Upload**: ActiveStorage for file management
- **Supported Formats**: PDF (.pdf), DOCX (.docx), Text (.txt)
- **File Size Limit**: 10 MB per file
- **Storage**: Local filesystem (Docker volume)
- **Validation**:
  - File type validation (MIME type checking)
  - File size limit enforcement
  - User cannot upload duplicate files (same filename + checksum)

#### API Endpoints
```
POST   /api/v1/resumes           - Upload new resume
GET    /api/v1/resumes           - List all user's resumes
GET    /api/v1/resumes/:id       - Get single resume details
DELETE /api/v1/resumes/:id       - Delete resume
GET    /api/v1/resumes/:id/file  - Download original file
```

#### UI Components
- File upload component with drag-and-drop
- Resume list view (cards with filename, upload date, status)
- Resume detail view
- Delete confirmation modal

---

### 3. Resume Parsing

#### User Stories
- As a user, I want the system to automatically extract information from my resume
- As a user, I want to see parsed data including:
  - Personal info (name, email, phone, location)
  - Skills list
  - Work experience
  - Education
- As a user, I want to know if parsing failed and why
- As a user, I want to retry parsing if it fails

#### Technical Requirements

**Text Extraction**
- PDF parsing: `pdf-reader` gem
- DOCX parsing: `docx` gem
- TXT parsing: Native Ruby File I/O

**LLM Parsing**
- Use OpenAI GPT-4 (or GPT-3.5-turbo for cost)
- Structured prompt engineering for consistent output
- JSON schema validation for parsed output
- Error handling for malformed responses

**Parsing Logic**
```ruby
# Prompt structure
System: You are a resume parser. Extract the following fields...
User: [Resume text]
Response: JSON with { name, email, phone, skills, experience, education }
```

**Background Processing**
- Parsing runs asynchronously via Solid Queue
- User sees "Processing..." status
- Frontend polls for completion (or WebSocket in future)

**Data Storage**
- Parsed data stored as JSONB in `resumes.parsed_data`
- Indexed for searchability

#### Parsed Data Schema
```json
{
  "personal_info": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York, NY",
    "linkedin": "linkedin.com/in/johndoe"
  },
  "skills": [
    { "name": "Ruby on Rails", "category": "Backend" },
    { "name": "Vue.js", "category": "Frontend" },
    { "name": "PostgreSQL", "category": "Database" }
  ],
  "experience": [
    {
      "company": "Acme Corp",
      "title": "Software Engineer",
      "location": "New York, NY",
      "start_date": "2020-01",
      "end_date": "2023-06",
      "duration": "3 years 6 months",
      "responsibilities": [
        "Built RESTful APIs using Rails",
        "Mentored 2 junior developers"
      ]
    }
  ],
  "education": [
    {
      "institution": "MIT",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduation_year": "2020"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Developer",
      "issuer": "Amazon",
      "date": "2022-05"
    }
  ]
}
```

#### API Endpoints
```
POST /api/v1/resumes/:id/parse   - Trigger parsing
GET  /api/v1/resumes/:id/status  - Check parsing status
```

#### UI Components
- Parsing status indicator (pending/processing/completed/failed)
- Parsed data display component (formatted JSON or structured view)
- Retry button for failed parsing
- Validation warnings display

---

### 4. Job Description Input & Scraping

#### User Stories
- As a user, I want to paste a job posting URL
- As a user, I want the system to scrape the job description text
- As a user, I want to see all job descriptions I've added
- As a user, I want to manually paste job description text if scraping fails

#### Technical Requirements

**URL Scraping**
- Use `Nokogiri` + `HTTParty` for basic scraping
- Handle common job sites: LinkedIn, Indeed, Greenhouse, Lever
- Fallback: Allow manual text input if scraping fails
- User-Agent rotation to avoid blocking

**Validation**
- URL format validation
- Duplicate URL detection (same job, same user)

**Storage**
- Store both original HTML and extracted text
- Store URL, company name, job title

#### API Endpoints
```
POST   /api/v1/job_descriptions              - Add job URL or text
GET    /api/v1/job_descriptions              - List all jobs
GET    /api/v1/job_descriptions/:id          - Get single job
DELETE /api/v1/job_descriptions/:id          - Delete job
POST   /api/v1/job_descriptions/:id/scrape   - Trigger scraping
```

#### UI Components
- URL input form
- Manual text input fallback (textarea)
- Job description list view
- Job description detail view with original text

---

### 5. Job Description Parsing

#### User Stories
- As a user, I want the system to extract key attributes from job descriptions
- As a user, I want to see:
  - Job title
  - Company name
  - Required skills
  - Nice-to-have skills
  - Experience level
  - Education requirements
  - Salary range (if available)
  - Location/remote status
  - Job type (full-time, contract, etc.)

#### Technical Requirements

**LLM Parsing**
- Use OpenAI GPT-4 for attribute extraction
- Structured prompt with examples (few-shot learning)
- JSON schema output validation

**Parsing Logic**
```ruby
# Prompt structure
System: Extract job posting attributes into this schema...
User: [Job description text]
Response: JSON with { title, company, skills_required, ... }
```

**Background Processing**
- Parse asynchronously after scraping completes
- User sees "Processing..." then parsed attributes

**Data Storage**
- Attributes stored as JSONB in `job_descriptions.attributes`

#### Parsed Data Schema
```json
{
  "title": "Junior Software Developer",
  "company": "TechCorp Inc.",
  "location": "Remote",
  "job_type": "Full-time",
  "experience_level": "1-2 years",
  "education_requirement": "Bachelor's degree in Computer Science or related field",
  "salary_range": {
    "min": 60000,
    "max": 80000,
    "currency": "USD",
    "period": "annual"
  },
  "skills_required": [
    "JavaScript",
    "React",
    "Node.js",
    "SQL",
    "Git"
  ],
  "skills_nice_to_have": [
    "Docker",
    "AWS",
    "TypeScript"
  ],
  "responsibilities": [
    "Build and maintain web applications",
    "Collaborate with cross-functional teams",
    "Write clean, maintainable code"
  ],
  "benefits": [
    "Health insurance",
    "401k matching",
    "Remote work"
  ],
  "application_deadline": "2025-12-31",
  "requires_bilingual": false,
  "industry": "FinTech",
  "team_size": "10-50 employees"
}
```

#### API Endpoints
```
POST /api/v1/job_descriptions/:id/parse   - Trigger parsing
GET  /api/v1/job_descriptions/:id/status  - Check parsing status
```

#### UI Components
- Parsing status indicator
- Parsed attributes display (card layout with sections)
- Skills tags/chips
- Retry button for failed parsing

---

### 6. Dashboard & Overview

#### User Stories
- As a user, I want to see a dashboard with:
  - Number of resumes uploaded
  - Number of job descriptions saved
  - Recent activity
- As a user, I want quick access to upload resume or add job

#### UI Components
- Dashboard view with stats cards
- Quick action buttons
- Recent resumes list (last 5)
- Recent job descriptions list (last 5)

---

## Success Criteria

### Must Have
- [ ] User can register, login, logout
- [ ] User can upload PDF, DOCX, TXT resumes
- [ ] Resumes are parsed into structured JSON with 90%+ accuracy
- [ ] User can input job description URLs
- [ ] Job descriptions are scraped successfully for major job boards
- [ ] Job descriptions are parsed into attributes with 85%+ accuracy
- [ ] User can view all parsed data in a clean UI
- [ ] Error handling for failed uploads, parsing, scraping

### Nice to Have
- [ ] Resume parsing validation warnings (missing sections, typos)
- [ ] Job description text highlighting (matched skills)
- [ ] Export parsed data as JSON
- [ ] Dark mode UI toggle

### Out of Scope (Phase 2+)
- Resume customization with variables
- Email/LinkedIn automation
- Recruiter discovery
- Automated job applications
- Application tracking lifecycle
- Multi-user collaboration

---

## Technical Milestones

### Milestone 1: Setup & Authentication (Week 1)
- [ ] Initialize Rails 8 API project
- [ ] Initialize Vue 3 + Vite project
- [ ] Docker Compose setup
- [ ] PostgreSQL configuration
- [ ] Devise + JWT authentication
- [ ] Login/Register UI

### Milestone 2: Resume Upload & Parsing (Week 2)
- [ ] ActiveStorage setup
- [ ] File upload API endpoints
- [ ] File upload UI component
- [ ] Text extraction from PDF/DOCX/TXT
- [ ] OpenAI integration
- [ ] Resume parsing service
- [ ] Background job for parsing
- [ ] Parsed data display UI

### Milestone 3: Job Description Processing (Week 3)
- [ ] Job description model & endpoints
- [ ] Web scraping service (Nokogiri)
- [ ] Job description input UI
- [ ] Job parsing service (LLM)
- [ ] Parsed attributes display UI

### Milestone 4: Polish & Testing (Week 4)
- [ ] Dashboard UI
- [ ] Error handling & user feedback
- [ ] Loading states & spinners
- [ ] Basic RSpec tests (models, services)
- [ ] Basic Vitest tests (components)
- [ ] Documentation updates

---

## Risk Assessment

### High Risk
- **LLM Parsing Accuracy**: GPT-4 may not always extract data correctly
  - Mitigation: Provide detailed prompts, examples, JSON schema validation
  - Allow users to manually edit parsed data (future)

- **Web Scraping Reliability**: Job sites may block scrapers or change HTML structure
  - Mitigation: Manual text input fallback
  - Site-specific parsers for major job boards

### Medium Risk
- **File Format Support**: Complex PDFs (multi-column, images) may fail
  - Mitigation: Clear error messages, support TXT as fallback

- **OpenAI Costs**: Parsing many resumes/jobs can get expensive
  - Mitigation: Use GPT-3.5-turbo for MVP, cache results

### Low Risk
- **Authentication**: Devise is battle-tested
- **File Storage**: ActiveStorage is reliable for local storage

---

## Cost Estimation (MVP)

### Development Time
- **Solo developer**: 3-4 weeks full-time
- **Part-time**: 6-8 weeks

### Infrastructure Costs (Monthly)
- **Development**: $0 (local Docker)
- **Production (small scale)**:
  - Hosting (Render): ~$7-25/month
  - PostgreSQL: ~$7/month
  - OpenAI API: ~$20-50/month (depends on usage)
  - **Total**: ~$35-80/month

---

## Next Steps After MVP

### Phase 2: Resume Customization
- Dynamic variable templating
- Multiple resume versions per user
- Section reordering

### Phase 3: Application Tracking
- Link resumes to job descriptions
- Track application status
- Notes and follow-ups

### Phase 4: Outreach Automation
- Gmail integration (OAuth)
- Email template system
- Automated sending (with user approval)

### Phase 5: Advanced Features
- LinkedIn automation (high risk)
- Recruiter discovery
- Job board application bots

---

## User Feedback Loop

### MVP Testing Plan
1. Internal testing (developer)
2. Alpha testing (5-10 friends/colleagues)
3. Gather feedback on:
   - Parsing accuracy
   - UI/UX clarity
   - Missing features
4. Iterate before broader release

---

Last Updated: 2025-11-04
