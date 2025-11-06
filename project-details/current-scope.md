# Current Scope - Resume & Job Description Parsing MVP

## Feature: Intelligent Document Parsing System

**Goal:** Build a minimal but functional system that can parse resumes and job descriptions into structured data using LLMs.

**Timeline:** 2-3 weeks

**Status:** Not Started

---

## Task Breakdown

### Task 1: Project Initialization & Docker Setup

**Objective:** Set up the basic project structure with Docker environment

**Backend Requirements:**
- Initialize Rails 8 API-only application
  ```bash
  rails new backend --api --database=postgresql --skip-test
  ```
- Configure `config/database.yml` to use environment variables
- Add gems to Gemfile:
  - `devise`
  - `devise-jwt`
  - `rack-cors`
  - `dotenv-rails`
  - `pdf-reader`
  - `docx`
  - `ruby-openai`
- Create `backend/Dockerfile` (Alpine-based Ruby 3.2.2)
- Create `backend/.dockerignore`

**Frontend Requirements:**
- Initialize Vue 3 + Vite application
  ```bash
  npm create vite@latest frontend -- --template vue
  ```
- Install dependencies:
  - `vue-router`
  - `pinia`
  - `axios`
  - `tailwindcss`
- Create `frontend/Dockerfile` (Node 18 Alpine)
- Configure Tailwind CSS

**Infrastructure:**
- Create root-level `docker-compose.yml` with 3 services:
  - PostgreSQL 15
  - Rails backend (port 3000)
  - Vue frontend (port 5173)
- Create `.env.example` with all required variables
- Create `.env` (gitignored) with actual values

**Acceptance Criteria:**
- [ ] `docker-compose up` starts all 3 services successfully
- [ ] Backend accessible at `http://localhost:3000`
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] Database connection working
- [ ] No errors in any container logs

---

### Task 2: Basic Authentication (Minimal)

**Objective:** Implement simple JWT-based authentication (just enough to secure API)

**Backend Implementation:**
- Install and configure Devise
  ```bash
  rails generate devise:install
  rails generate devise User
  ```
- Add JWT authentication via `devise-jwt`
- Create migration for `users` table:
  - `email` (string, unique, not null)
  - `encrypted_password` (string, not null)
  - Devise trackable fields (optional)
- Create `api/v1/auth_controller.rb`:
  - `POST /api/v1/auth/register` - Create user, return JWT
  - `POST /api/v1/auth/login` - Validate credentials, return JWT
  - `DELETE /api/v1/auth/logout` - Invalidate JWT
- Configure CORS in `config/initializers/cors.rb`
- Add JWT secret to `.env`

**Frontend Implementation:**
- Create Pinia auth store (`stores/auth.js`):
  - State: `user`, `token`, `isAuthenticated`
  - Actions: `register()`, `login()`, `logout()`
- Create API service (`services/api.js`):
  - Axios instance with base URL
  - Request interceptor to add JWT token
  - Response interceptor to handle 401 errors
- Create auth service (`services/authService.js`)
- Create simple login/register views (functional, no styling yet)
- Add route guards in router

**Acceptance Criteria:**
- [ ] User can register via frontend form
- [ ] User receives JWT token on successful login
- [ ] Token stored in localStorage
- [ ] Protected routes redirect to login if not authenticated
- [ ] Logout clears token and redirects to login

---

### Task 3: Resume Upload & Storage

**Objective:** Allow users to upload resume files (PDF, DOCX, TXT) and store them

**Backend Implementation:**
- Install ActiveStorage:
  ```bash
  rails active_storage:install
  rails db:migrate
  ```
- Create `Resume` model and migration:
  ```ruby
  # Columns:
  # - user_id (references users, not null)
  # - name (string, not null)
  # - status (string, default: 'pending')
  # - parsed_data (jsonb)
  # - error_message (text)
  # - timestamps
  ```
- Add `has_one_attached :file` to Resume model
- Add validations:
  - File must be attached
  - Content type: PDF, DOCX, or TXT only
  - File size < 10 MB
  - Name presence
- Create `api/v1/resumes_controller.rb`:
  - `POST /api/v1/resumes` - Upload resume
  - `GET /api/v1/resumes` - List user's resumes
  - `GET /api/v1/resumes/:id` - Get single resume
  - `DELETE /api/v1/resumes/:id` - Delete resume
- Add `belongs_to :user` and `has_many :resumes` associations

**Frontend Implementation:**
- Create resume store (`stores/resume.js`)
- Create file upload component (`components/common/FileUpload.vue`):
  - Drag-and-drop support
  - File type validation (client-side)
  - File size validation
  - Upload progress indicator
- Create resume service (`services/resumeService.js`)
- Create resume list view (`views/ResumeListView.vue`)
- Create resume upload form

**Acceptance Criteria:**
- [ ] User can upload PDF/DOCX/TXT files via drag-drop or click
- [ ] File validation works (type, size)
- [ ] Uploaded resume appears in user's resume list
- [ ] Resume stored in ActiveStorage (check `storage/` directory)
- [ ] User can delete their own resumes
- [ ] Appropriate error messages for invalid files

---

### Task 4: File Text Extraction Service

**Objective:** Extract raw text from uploaded resume files

**Backend Implementation:**
- Create parser classes in `app/lib/parsers/`:

  **`pdf_parser.rb`:**
  ```ruby
  class PdfParser
    def self.extract(file_path)
      reader = PDF::Reader.new(file_path)
      reader.pages.map(&:text).join("\n")
    rescue => e
      Rails.logger.error("PDF parsing failed: #{e.message}")
      raise "Unable to parse PDF file"
    end
  end
  ```

  **`docx_parser.rb`:**
  ```ruby
  class DocxParser
    def self.extract(file_path)
      doc = Docx::Document.open(file_path)
      doc.paragraphs.map(&:text).join("\n")
    rescue => e
      Rails.logger.error("DOCX parsing failed: #{e.message}")
      raise "Unable to parse DOCX file"
    end
  end
  ```

  **`text_parser.rb`:**
  ```ruby
  class TextParser
    def self.extract(file_path)
      File.read(file_path, encoding: 'UTF-8')
    rescue => e
      Rails.logger.error("Text file reading failed: #{e.message}")
      raise "Unable to read text file"
    end
  end
  ```

- Create unified service (`app/services/file_processor_service.rb`):
  ```ruby
  class FileProcessorService
    def self.extract_text(active_storage_blob)
      # Download file to temp location
      file_path = ActiveStorage::Blob.service.path_for(active_storage_blob.key)

      # Route to appropriate parser
      case active_storage_blob.content_type
      when 'application/pdf'
        PdfParser.extract(file_path)
      when 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        DocxParser.extract(file_path)
      when 'text/plain'
        TextParser.extract(file_path)
      else
        raise "Unsupported file type: #{active_storage_blob.content_type}"
      end
    end
  end
  ```

**Testing:**
- Create test files in `spec/fixtures/files/`:
  - `sample_resume.pdf`
  - `sample_resume.docx`
  - `sample_resume.txt`
- Test each parser independently in Rails console

**Acceptance Criteria:**
- [ ] Can extract text from PDF files
- [ ] Can extract text from DOCX files
- [ ] Can extract text from TXT files
- [ ] Proper error handling for corrupted files
- [ ] Extracted text contains actual content (not garbled)
- [ ] Special characters handled correctly (UTF-8)

---

### Task 5: OpenAI LLM Integration Service

**Objective:** Create abstraction layer for LLM API calls with OpenAI implementation

**Backend Implementation:**
- Add OpenAI API key to `.env`:
  ```
  OPENAI_API_KEY=sk-...
  ```

- Create LLM abstraction (`app/services/llm_service.rb`):
  ```ruby
  class LLMService
    def self.parse_resume(text)
      client.parse_resume(text)
    end

    def self.parse_job_description(text)
      client.parse_job_description(text)
    end

    private

    def self.client
      @client ||= LLM::OpenAIClient.new
    end
  end
  ```

- Create OpenAI client (`app/services/llm/openai_client.rb`):
  ```ruby
  module LLM
    class OpenAIClient
      def initialize
        @client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
      end

      def parse_resume(text)
        response = @client.chat(
          parameters: {
            model: 'gpt-4',
            messages: [
              { role: 'system', content: resume_system_prompt },
              { role: 'user', content: text }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          }
        )

        JSON.parse(response.dig('choices', 0, 'message', 'content'))
      rescue JSON::ParserError, OpenAI::Error => e
        Rails.logger.error("LLM resume parsing failed: #{e.message}")
        raise "Failed to parse resume with LLM"
      end

      def parse_job_description(text)
        response = @client.chat(
          parameters: {
            model: 'gpt-4',
            messages: [
              { role: 'system', content: job_system_prompt },
              { role: 'user', content: text }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          }
        )

        JSON.parse(response.dig('choices', 0, 'message', 'content'))
      rescue JSON::ParserError, OpenAI::Error => e
        Rails.logger.error("LLM job parsing failed: #{e.message}")
        raise "Failed to parse job description with LLM"
      end

      private

      def resume_system_prompt
        # See Task 6 for detailed prompt
      end

      def job_system_prompt
        # See Task 7 for detailed prompt
      end
    end
  end
  ```

**Acceptance Criteria:**
- [ ] OpenAI API key configured correctly
- [ ] Can make successful API calls to OpenAI
- [ ] Error handling for API failures (rate limits, invalid key)
- [ ] Logging of API calls and responses
- [ ] Abstraction allows easy swapping of LLM providers

---

### Task 6: Resume Parsing Prompt & Logic

**Objective:** Design and implement the LLM prompt for resume parsing

**Prompt Design (`resume_system_prompt` method):**
```
You are a professional resume parser. Your task is to extract structured information from resume text and return it as a valid JSON object.

Extract the following fields:

{
  "personal_info": {
    "name": "Full name of the candidate",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State/Country",
    "linkedin": "LinkedIn URL (if present)",
    "github": "GitHub URL (if present)",
    "portfolio": "Portfolio website (if present)"
  },
  "summary": "Professional summary or objective (if present)",
  "skills": [
    {
      "name": "Skill name",
      "category": "Frontend/Backend/Database/DevOps/Soft Skills/Other"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "location": "City, State/Country",
      "start_date": "YYYY-MM format",
      "end_date": "YYYY-MM or 'Present'",
      "duration": "e.g., '2 years 3 months'",
      "responsibilities": ["List of responsibilities/achievements"]
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree type (e.g., Bachelor of Science)",
      "field": "Major/Field of study",
      "location": "City, State/Country",
      "graduation_year": "YYYY",
      "gpa": "GPA if mentioned (optional)"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "YYYY-MM",
      "credential_id": "ID if present"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "description": "Brief description",
      "technologies": ["Tech stack used"],
      "url": "Project URL if available"
    }
  ],
  "languages": [
    {
      "language": "Language name",
      "proficiency": "Native/Fluent/Professional/Conversational/Basic"
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- If a field is not found, use null or empty array []
- Categorize skills accurately
- Extract all relevant information
- Preserve formatting of dates consistently
```

**Service Implementation:**
- Create `app/services/resume_parser_service.rb`:
  ```ruby
  class ResumeParserService
    def initialize(resume)
      @resume = resume
    end

    def parse
      @resume.update!(status: 'processing')

      # Extract text
      text = extract_text

      # Parse with LLM
      parsed_data = LLMService.parse_resume(text)

      # Validate structure
      validate_parsed_data(parsed_data)

      # Save to database
      @resume.update!(
        status: 'completed',
        parsed_data: parsed_data
      )

      parsed_data
    rescue => e
      @resume.update!(
        status: 'failed',
        error_message: e.message
      )
      raise
    end

    private

    def extract_text
      FileProcessorService.extract_text(@resume.file.blob)
    end

    def validate_parsed_data(data)
      required_keys = ['personal_info', 'skills', 'experience', 'education']
      missing_keys = required_keys - data.keys

      if missing_keys.any?
        raise "Invalid parsed data: missing keys #{missing_keys.join(', ')}"
      end
    end
  end
  ```

**Acceptance Criteria:**
- [ ] Prompt returns valid JSON consistently
- [ ] All major sections extracted (personal info, skills, experience, education)
- [ ] Skills categorized correctly
- [ ] Dates formatted consistently (YYYY-MM)
- [ ] Missing sections return null/empty arrays (not errors)
- [ ] Tested with at least 3 different resume formats

---

### Task 7: Job Description Parsing Prompt & Logic

**Objective:** Design and implement job description parsing with URL scraping

**Backend Implementation:**

**Create `JobDescription` model:**
```ruby
# Migration:
# - user_id (references, not null)
# - url (text)
# - title (string)
# - company_name (string)
# - raw_text (text)
# - attributes (jsonb)
# - status (string, default: 'pending')
# - error_message (text)
# - timestamps
```

**Create web scraper (`app/services/web_scraper_service.rb`):**
```ruby
class WebScraperService
  USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  ].freeze

  def self.scrape(url)
    response = HTTParty.get(url, headers: { 'User-Agent' => USER_AGENTS.sample })

    raise "HTTP Error: #{response.code}" unless response.success?

    doc = Nokogiri::HTML(response.body)
    extract_job_text(doc, url)
  end

  private

  def self.extract_job_text(doc, url)
    # Try common job board selectors
    selectors = [
      '.job-description',
      '.description',
      '[class*="description"]',
      '[id*="description"]',
      'body'
    ]

    selectors.each do |selector|
      element = doc.css(selector).first
      next unless element

      text = element.text.strip
      return text if text.length > 100 # Ensure we got meaningful content
    end

    raise "Could not extract job description from URL"
  end
end
```

**Create job parser service (`app/services/job_parser_service.rb`):**
```ruby
class JobParserService
  def initialize(job_description)
    @job_description = job_description
  end

  def parse
    @job_description.update!(status: 'parsing')

    # Parse with LLM
    attributes = LLMService.parse_job_description(@job_description.raw_text)

    # Save to database
    @job_description.update!(
      status: 'completed',
      title: attributes['title'],
      company_name: attributes['company'],
      attributes: attributes
    )

    attributes
  rescue => e
    @job_description.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end
end
```

**Job Parsing Prompt (`job_system_prompt` method):**
```
You are an expert job description parser. Extract key information from job postings and return as valid JSON.

Extract the following fields:

{
  "title": "Job title",
  "company": "Company name",
  "location": "Location (city, state, country or 'Remote')",
  "remote_type": "Remote/Hybrid/On-site",
  "job_type": "Full-time/Part-time/Contract/Internship",
  "experience_level": "Entry/Junior/Mid/Senior/Lead/Executive",
  "years_of_experience": "e.g., '1-2 years', '3+ years', '5-7 years'",
  "education_requirement": "Education requirement description",
  "salary_range": {
    "min": 60000,
    "max": 80000,
    "currency": "USD",
    "period": "annual/monthly/hourly"
  },
  "skills_required": [
    {
      "name": "Skill name",
      "category": "Technical/Soft Skill",
      "importance": "Required/Preferred"
    }
  ],
  "skills_nice_to_have": ["Bonus skills as array of strings"],
  "responsibilities": ["List of job responsibilities"],
  "qualifications": ["List of required qualifications"],
  "benefits": ["Company benefits listed"],
  "industry": "Industry sector (e.g., FinTech, Healthcare, E-commerce)",
  "requires_bilingual": true/false,
  "languages_required": ["Languages if any"],
  "visa_sponsorship": true/false (if mentioned)
}

IMPORTANT:
- Return ONLY valid JSON
- If salary not mentioned, use null for salary_range
- Categorize skills as Required vs Preferred
- Extract all technical skills mentioned
- If field not found, use null or empty array []
```

**Create controller (`api/v1/job_descriptions_controller.rb`):**
- `POST /api/v1/job_descriptions` - Create with URL or raw text
- `GET /api/v1/job_descriptions` - List user's jobs
- `GET /api/v1/job_descriptions/:id` - Get single job

**Acceptance Criteria:**
- [ ] Can scrape job descriptions from URLs
- [ ] Can accept manually pasted text as fallback
- [ ] LLM extracts all key attributes
- [ ] Skills categorized as required vs nice-to-have
- [ ] Salary parsing handles various formats
- [ ] Works with major job boards (LinkedIn, Indeed, Greenhouse)

---

### Task 8: Background Job Processing

**Objective:** Move parsing to background jobs for better UX

**Backend Implementation:**
- Install Solid Queue (Rails 8 default):
  ```bash
  rails solid_queue:install
  rails db:migrate
  ```

- Create `app/jobs/parse_resume_job.rb`:
  ```ruby
  class ParseResumeJob < ApplicationJob
    queue_as :default
    retry_on OpenAI::Error, wait: :exponentially_longer, attempts: 3

    def perform(resume_id)
      resume = Resume.find(resume_id)
      ResumeParserService.new(resume).parse
    end
  end
  ```

- Create `app/jobs/scrape_and_parse_job_job.rb`:
  ```ruby
  class ScrapeAndParseJobJob < ApplicationJob
    queue_as :default

    def perform(job_description_id)
      job_description = JobDescription.find(job_description_id)

      # Scrape if URL provided
      if job_description.url.present?
        job_description.update!(status: 'scraping')
        raw_text = WebScraperService.scrape(job_description.url)
        job_description.update!(raw_text: raw_text)
      end

      # Parse
      JobParserService.new(job_description).parse
    end
  end
  ```

- Add callbacks to models:
  ```ruby
  # app/models/resume.rb
  after_create :enqueue_parsing

  def enqueue_parsing
    ParseResumeJob.perform_later(id)
  end

  # app/models/job_description.rb
  after_create :enqueue_scraping

  def enqueue_scraping
    ScrapeAndParseJobJob.perform_later(id)
  end
  ```

- Add status endpoints:
  ```ruby
  # In controllers
  def status
    resource = find_resource(params[:id])
    render json: {
      status: resource.status,
      error_message: resource.error_message
    }
  end
  ```

**Frontend Implementation:**
- Create polling mechanism in stores:
  ```javascript
  async pollResumeStatus(id) {
    const poll = setInterval(async () => {
      const response = await resumeService.getStatus(id)
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        clearInterval(poll)
        await this.fetchResumes() // Refresh list
      }
    }, 2000) // Poll every 2 seconds
  }
  ```

**Acceptance Criteria:**
- [ ] Resume parsing runs in background
- [ ] Job scraping/parsing runs in background
- [ ] User sees "Processing..." status immediately after upload
- [ ] Frontend polls for completion
- [ ] Failed jobs show error messages
- [ ] Retry logic works for transient failures

---

### Task 9: Frontend Display Components

**Objective:** Build UI to display parsed data beautifully

**Components to Create:**

**1. `ParsedResumeDisplay.vue`:**
- Sections for each resume part (personal info, skills, experience, education)
- Skills displayed as tags/chips with category colors
- Experience timeline view
- Copy-to-clipboard for email/phone
- Edit button (future: allow manual corrections)

**2. `ParsedJobDisplay.vue`:**
- Job header (title, company, location)
- Salary range display
- Required skills (tags with "Required" badge)
- Nice-to-have skills (tags with "Bonus" badge)
- Responsibilities as bullet list
- Benefits section
- "Match Score" placeholder (future: compare with resume)

**3. `LoadingStates.vue`:**
- Skeleton loaders for parsing states
- Progress indicators
- "Parsing in progress" animations

**4. `ErrorDisplay.vue`:**
- User-friendly error messages
- Retry button
- Suggestions for common issues

**Views:**
- `ResumeDetailView.vue` - Full resume display
- `JobDetailView.vue` - Full job description display
- Dashboard with recent items

**Styling:**
- Use Tailwind CSS
- Clean, minimal design
- Good contrast and readability
- Responsive (mobile-friendly)

**Acceptance Criteria:**
- [ ] Parsed resume data displays in clean, organized format
- [ ] Parsed job data displays all extracted attributes
- [ ] Loading states show during processing
- [ ] Error states show helpful messages
- [ ] UI is responsive and functional on mobile
- [ ] Copy-to-clipboard works for contact info

---

### Task 10: End-to-End Testing & Refinement

**Objective:** Test the complete flow and refine based on real-world results

**Testing Scenarios:**

**Resume Testing:**
- [ ] Upload PDF resume → parse → verify accuracy
- [ ] Upload DOCX resume → parse → verify accuracy
- [ ] Upload TXT resume → parse → verify accuracy
- [ ] Test with different resume formats:
  - Single column
  - Two column
  - Resume with no experience section
  - Resume with certifications
  - Resume with projects
- [ ] Test edge cases:
  - Very short resume (1 page)
  - Very long resume (5+ pages)
  - Resume with special characters
  - Resume in different formatting styles

**Job Description Testing:**
- [ ] Scrape from LinkedIn job posting
- [ ] Scrape from Indeed
- [ ] Scrape from Greenhouse/Lever
- [ ] Manually paste job description
- [ ] Test with jobs having:
  - Salary listed
  - No salary
  - Remote positions
  - Bilingual requirements
  - Multiple skills listed

**System Testing:**
- [ ] Upload 5 resumes simultaneously → all parse correctly
- [ ] Add 5 job descriptions → all scrape and parse
- [ ] Test error handling (invalid URLs, corrupted files)
- [ ] Test with slow network (ensure polling works)

**Refinement Tasks:**
- Improve LLM prompts based on parsing accuracy
- Add better error messages for common failures
- Optimize UI based on real data display
- Add validation warnings (missing sections, etc.)
- Document known issues and workarounds

**Acceptance Criteria:**
- [ ] 90%+ accuracy on resume parsing (personal info, skills, experience)
- [ ] 85%+ accuracy on job description parsing
- [ ] All edge cases handled gracefully
- [ ] No critical bugs in happy path
- [ ] Performance acceptable (parsing < 30 seconds)
- [ ] Documentation updated with learnings

---

## Definition of Done

**Feature is complete when:**
- [ ] All 10 tasks completed and acceptance criteria met
- [ ] Can upload resume → see parsed structured data
- [ ] Can input job URL → see parsed attributes
- [ ] Background processing works reliably
- [ ] UI displays parsed data clearly
- [ ] Error handling comprehensive
- [ ] Tested with real-world resumes and job postings
- [ ] Ready to demo to users for feedback

---

## Out of Scope (Future Phases)

- Resume editing/customization
- Job-resume matching/scoring
- Application tracking
- Email/LinkedIn automation
- Recruiter discovery
- Multiple resume versions

---

## Dependencies & Prerequisites

**Required:**
- OpenAI API key with credits
- Docker Desktop installed
- Ruby 3.2.2, Node 18 available
- PostgreSQL 15

**Nice to Have:**
- Sample resumes for testing (PDF, DOCX, TXT)
- Sample job URLs from different job boards

---

## Notes for Implementation

- Start with Task 1, complete sequentially
- Test each task before moving to next
- Keep prompts in version control (easy to iterate)
- Log all LLM API calls for debugging
- Budget ~$20-50 for OpenAI during development
- Consider GPT-3.5-turbo for initial testing (cheaper)

---

Last Updated: 2025-11-04
