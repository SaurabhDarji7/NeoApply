# NeoApply - System Architecture

## High-Level Overview

NeoApply follows a **decoupled SPA architecture** with clear separation between frontend and backend concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Vue.js 3 SPA (Port 5173)                  │    │
│  │  - Vite Dev Server                                 │    │
│  │  - Vue Router                                      │    │
│  │  - Pinia State Management                          │    │
│  │  - Axios HTTP Client                               │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          │ HTTP/HTTPS                        │
│                          │ JSON + JWT                        │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Rails 8 API Backend (Port 3000)                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Controllers (api/v1/*)                        │    │
│  │  - AuthenticationController                        │    │
│  │  - ResumesController                               │    │
│  │  - JobDescriptionsController                       │    │
│  │  - UsersController                                 │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Service Layer                                     │    │
│  │  - ResumeParserService                             │    │
│  │  - JobDescriptionParserService                     │    │
│  │  - LLMService (OpenAI abstraction)                 │    │
│  │  - FileProcessorService                            │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Models & ActiveRecord                             │    │
│  │  - User                                            │    │
│  │  - Resume                                          │    │
│  │  - JobDescription                                  │    │
│  │  - Application (resume + job pairing)              │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Background Jobs (Sidekiq)                     │    │
│  │  - ParseResumeJob                                  │    │
│  │  - ParseJobDescriptionJob                          │    │
│  │  - ScrapeJobPostingJob (future)                    │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────┼───────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (Port 5432)                │
│                                                              │
│  Tables:                                                     │
│  - users                                                     │
│  - resumes (with JSONB parsed_data column)                  │
│  - job_descriptions (with JSONB attributes column)           │
│  - applications                                              │
│  - active_storage_blobs                                      │
│  - active_storage_attachments                                │
│  - solid_queue_* (job queue tables)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│                                                              │
│  - OpenAI API (GPT-4 for parsing)                           │
│  - Gmail API (future)                                        │
│  - LinkedIn API (future)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Architecture (Vue.js SPA)

#### Directory Structure
```
frontend/
├── src/
│   ├── main.js                 # App entry point
│   ├── App.vue                 # Root component
│   ├── router/
│   │   └── index.js            # Vue Router config
│   ├── stores/
│   │   ├── auth.js             # Authentication state
│   │   ├── resume.js           # Resume management
│   │   └── jobs.js             # Job descriptions state
│   ├── views/
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── DashboardView.vue
│   │   ├── ResumeUploadView.vue
│   │   ├── ResumeDetailView.vue
│   │   ├── JobDescriptionView.vue
│   │   └── ApplicationsView.vue
│   ├── components/
│   │   ├── common/
│   │   │   ├── NavBar.vue
│   │   │   ├── FileUpload.vue
│   │   │   └── LoadingSpinner.vue
│   │   ├── resume/
│   │   │   ├── ResumeCard.vue
│   │   │   ├── ResumeForm.vue
│   │   │   └── ParsedDataDisplay.vue
│   │   └── jobs/
│   │       ├── JobDescriptionCard.vue
│   │       ├── JobAttributesDisplay.vue
│   │       └── JobUrlInput.vue
│   ├── services/
│   │   ├── api.js              # Axios instance + interceptors
│   │   ├── authService.js      # Login/logout/register
│   │   ├── resumeService.js    # Resume CRUD
│   │   └── jobService.js       # Job description CRUD
│   └── assets/
│       ├── styles/
│       └── images/
```

#### Key Frontend Patterns

**State Management (Pinia)**
```javascript
// stores/auth.js
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('jwt_token')
  }),
  actions: {
    async login(credentials) {
      const response = await authService.login(credentials)
      this.token = response.data.token
      this.user = response.data.user
      localStorage.setItem('jwt_token', this.token)
    }
  }
})
```

**API Service Layer**
```javascript
// services/api.js
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor to add JWT token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

---

### 2. Backend Architecture (Rails API)

#### Directory Structure
```
backend/
├── app/
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   └── api/
│   │       └── v1/
│   │           ├── authentication_controller.rb
│   │           ├── users_controller.rb
│   │           ├── resumes_controller.rb
│   │           └── job_descriptions_controller.rb
│   ├── models/
│   │   ├── user.rb
│   │   ├── resume.rb
│   │   ├── job_description.rb
│   │   └── application.rb
│   ├── services/
│   │   ├── llm_service.rb              # OpenAI abstraction
│   │   ├── resume_parser_service.rb     # Resume parsing logic
│   │   ├── job_parser_service.rb        # Job description parsing
│   │   ├── file_processor_service.rb    # Extract text from files
│   │   └── web_scraper_service.rb       # Future: scrape job URLs
│   ├── jobs/
│   │   ├── parse_resume_job.rb
│   │   └── parse_job_description_job.rb
│   ├── serializers/
│   │   ├── user_serializer.rb
│   │   ├── resume_serializer.rb
│   │   └── job_description_serializer.rb
│   └── lib/
│       └── parsers/
│           ├── pdf_parser.rb
│           ├── docx_parser.rb
│           └── text_parser.rb
├── config/
│   ├── routes.rb
│   ├── database.yml
│   ├── initializers/
│   │   ├── devise.rb
│   │   ├── cors.rb
│   │   └── openai.rb
│   └── environments/
├── db/
│   ├── migrate/
│   └── schema.rb
└── spec/
    ├── models/
    ├── services/
    └── requests/
```

#### Key Backend Patterns

**Service Objects**
```ruby
# app/services/resume_parser_service.rb
class ResumeParserService
  def initialize(resume)
    @resume = resume
  end

  def parse
    # 1. Extract text from file
    text = FileProcessorService.extract_text(@resume.file)

    # 2. Send to LLM for parsing
    parsed_data = LLMService.parse_resume(text)

    # 3. Store structured data
    @resume.update(parsed_data: parsed_data)

    parsed_data
  end
end
```

**LLM Abstraction Layer**
```ruby
# app/services/llm_service.rb
class LLMService
  def self.parse_resume(text)
    client.parse_resume(text)
  end

  def self.parse_job_description(text)
    client.parse_job_description(text)
  end

  private

  def self.client
    @client ||= case ENV['LLM_PROVIDER']
    when 'openai'
      LLM::OpenAIClient.new
    when 'anthropic'
      LLM::AnthropicClient.new
    else
      raise "Unsupported LLM provider"
    end
  end
end
```

**Background Jobs**
```ruby
# app/jobs/parse_resume_job.rb
class ParseResumeJob < ApplicationJob
  queue_as :default

  def perform(resume_id)
    resume = Resume.find(resume_id)
    ResumeParserService.new(resume).parse
  end
end
```

---

## Data Flow

### Resume Upload & Parsing Flow

```
1. User uploads file (PDF/DOCX/TXT) via Vue.js
   ↓
2. Frontend sends multipart/form-data to POST /api/v1/resumes
   ↓
3. Rails controller creates Resume record + ActiveStorage attachment
   ↓
4. Controller enqueues ParseResumeJob
   ↓
5. Job extracts text using FileProcessorService
   ↓
6. Job sends text to LLMService
   ↓
7. LLMService calls OpenAI API with structured prompt
   ↓
8. OpenAI returns JSON with parsed fields:
   {
     "name": "John Doe",
     "email": "john@example.com",
     "skills": ["Ruby", "JavaScript"],
     "experience": [...],
     "education": [...]
   }
   ↓
9. Job stores parsed_data as JSONB in resume record
   ↓
10. Frontend polls or uses WebSocket to get updated resume
```

### Job Description Parsing Flow

```
1. User pastes job URL in Vue.js
   ↓
2. Frontend sends POST /api/v1/job_descriptions { url: "..." }
   ↓
3. Rails controller creates JobDescription record
   ↓
4. Controller enqueues ParseJobDescriptionJob
   ↓
5. Job scrapes URL using WebScraperService
   ↓
6. Job sends scraped text to LLMService
   ↓
7. LLMService calls OpenAI with extraction prompt
   ↓
8. OpenAI returns structured attributes:
   {
     "title": "Junior Software Developer",
     "skills_required": ["JavaScript", "SQL"],
     "experience_level": "1-2 years",
     "location": "Remote",
     "salary_range": "$60K-$80K"
   }
   ↓
9. Job stores attributes as JSONB in job_description record
   ↓
10. Frontend displays parsed attributes
```

---

## Authentication Flow

```
1. User enters email/password in Vue.js login form
   ↓
2. Frontend sends POST /api/v1/auth/login
   ↓
3. Devise authenticates user
   ↓
4. Rails generates JWT token using devise-jwt
   ↓
5. Response: { token: "eyJ...", user: { id, email, ... } }
   ↓
6. Frontend stores token in localStorage
   ↓
7. Subsequent requests include: Authorization: Bearer <token>
   ↓
8. Rails middleware validates JWT on each request
```

---

## API Versioning Strategy

All API endpoints are namespaced under `/api/v1/`:

```
/api/v1/auth/login
/api/v1/auth/register
/api/v1/auth/logout
/api/v1/resumes
/api/v1/resumes/:id
/api/v1/job_descriptions
/api/v1/job_descriptions/:id
/api/v1/applications
```

This allows for future API changes without breaking existing clients (v2, v3, etc.).

---

## Database Architecture

### Core Tables

**users**
- `id` (primary key)
- `email` (unique)
- `first_name` (string, unique)
- `last_name` (string)
- `telephone` (string)
- `encrypted_password`
- `created_at`, `updated_at`

**resumes**
- `id` (primary key)
- `user_id` (foreign key)
- `title` (string, e.g., "Software Engineer Resume")
- `parsed_data` (JSONB) - structured resume data
- `created_at`, `updated_at`
- ActiveStorage attachment: `file`

**job_descriptions**
- `id` (primary key)
- `user_id` (foreign key)
- `url` (string)
- `title` (string)
- `company_name` (string)
- `attributes` (JSONB) - parsed job attributes
- `created_at`, `updated_at`

**applications** (future: links resume + job)
- `id` (primary key)
- `user_id` (foreign key)
- `resume_id` (foreign key)
- `job_description_id` (foreign key)
- `status` (enum: draft, applied, interview, rejected, etc.)
- `created_at`, `updated_at`

### JSONB Schema Examples

**resumes.parsed_data**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "New York, NY",
  "skills": ["Ruby on Rails", "Vue.js", "PostgreSQL"],
  "experience": [
    {
      "company": "Acme Corp",
      "title": "Software Engineer",
      "duration": "2020-2023",
      "responsibilities": ["Built APIs", "Mentored juniors"]
    }
  ],
  "education": [
    {
      "institution": "MIT",
      "degree": "B.S. Computer Science",
      "year": "2020"
    }
  ]
}
```

**job_descriptions.attributes**
```json
{
  "title": "Junior Software Developer",
  "company": "TechCorp",
  "location": "Remote",
  "experience_level": "1-2 years",
  "skills_required": ["JavaScript", "React", "SQL"],
  "skills_nice_to_have": ["Docker", "AWS"],
  "education_requirement": "Bachelor's degree",
  "salary_range": "$60K-$80K",
  "job_type": "Full-time",
  "bilingual": false
}
```

---

## Error Handling Strategy

### Backend
```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity

  def not_found
    render json: { error: 'Resource not found' }, status: :not_found
  end

  def unprocessable_entity(exception)
    render json: { error: exception.message }, status: :unprocessable_entity
  end
end
```

### Frontend
```javascript
// services/api.js
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      router.push('/login')
    }
    return Promise.reject(error)
  }
)
```

---

## Security Architecture

### CORS Configuration
```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV['FRONTEND_URL'] || 'http://localhost:5173'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options],
      credentials: true
  end
end
```

### JWT Token Security
- Short-lived tokens (1 hour)
- Refresh token mechanism (future)
- Stored in httpOnly cookies (future improvement)
- Current: localStorage (acceptable for MVP)

### File Upload Security
- Whitelist file types: PDF, DOCX, TXT
- Max file size: 10 MB
- Secure file storage paths

---

## Scalability Considerations

### Current (MVP)
- Single server deployment
- Background jobs on same server
- Local file storage

### Future Scaling
- Separate job worker servers
- Move to cloud storage (S3/GCS)
- Database read replicas
- Redis for caching and Solid Cable
- CDN for frontend assets

---

## Development Workflow

1. **Local Development**
   - Docker Compose spins up all services
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`
   - Database: `localhost:5432`

2. **Code Changes**
   - Frontend: Hot module replacement (Vite)
   - Backend: Spring preloader for fast Rails restarts

3. **Testing**
   - Backend: `bundle exec rspec`
   - Frontend: `npm run test`

---


Last Updated: 2025-11-04
