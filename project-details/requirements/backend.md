# NeoApply - Backend Requirements

## Overview
The backend is a **Ruby on Rails 8 API-only application** that handles authentication, file processing, LLM integration, and data persistence.

---

## Core Requirements

### 1. Ruby on Rails Setup

**Version:**
- Ruby: 3.2+ (latest stable)
- Rails: 8.0+ (latest stable)

**Application Mode:**
- API-only mode (no views, no asset pipeline)
- JSON API responses

**Configuration:**
```bash
rails new neoapply-backend --api --database=postgresql --skip-test
```

---

### 2. Database

**PostgreSQL:**
- Version: 15+
- Required extensions:
  - `pgcrypto` (for UUID generation if needed)
  - Built-in JSONB support

**Connection:**
- Use environment variables for database config
- Connection pooling enabled

---

### 3. Authentication & Authorization

**Devise:**
- Install `devise` gem
- Install `devise-jwt` gem for API authentication

**Features Required:**
- User registration with email/password
- Login (returns JWT token)
- Logout (token revocation)
- Password reset (email-based)
- Token expiration (1 hour default)

**Configuration:**
```ruby
# Gemfile
gem 'devise'
gem 'devise-jwt'

# config/initializers/devise.rb
config.jwt do |jwt|
  jwt.secret = Rails.application.credentials.jwt_secret_key
  jwt.dispatch_requests = [['POST', %r{^/api/v1/auth/login$}]]
  jwt.revocation_requests = [['DELETE', %r{^/api/v1/auth/logout$}]]
  jwt.expiration_time = 1.hour.to_i
end
```

**Security:**
- Passwords hashed with bcrypt
- CSRF protection disabled (API-only, using JWT)
- Rate limiting on login attempts

---

### 4. File Upload & Storage

**ActiveStorage:**
- Rails built-in file upload system
- Local disk storage for MVP
- Future: S3/GCS integration

**Supported File Types:**
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Text (`.txt`)

**Validations:**
- File size limit: 10 MB
- MIME type validation
- Virus scanning (future consideration)

**Configuration:**
```ruby
# config/storage.yml
local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

# config/environments/development.rb
config.active_storage.service = :local
```

---

### 5. File Parsing Services

**PDF Parsing:**
```ruby
# Gemfile
gem 'pdf-reader'

# Usage
reader = PDF::Reader.new('resume.pdf')
text = reader.pages.map(&:text).join("\n")
```

**DOCX Parsing:**
```ruby
# Gemfile
gem 'docx'

# Usage
doc = Docx::Document.open('resume.docx')
text = doc.paragraphs.map(&:text).join("\n")
```

**Text Parsing:**
```ruby
# Native Ruby
text = File.read('resume.txt', encoding: 'UTF-8')
```

**Service Implementation:**
```ruby
# app/services/file_processor_service.rb
class FileProcessorService
  def self.extract_text(file)
    case file.content_type
    when 'application/pdf'
      PdfParser.extract(file)
    when 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      DocxParser.extract(file)
    when 'text/plain'
      TextParser.extract(file)
    else
      raise "Unsupported file type: #{file.content_type}"
    end
  end
end
```

---

### 6. LLM Integration (OpenAI)

**OpenAI Ruby Gem:**
```ruby
# Gemfile
gem 'ruby-openai'

# Configuration
OpenAI.configure do |config|
  config.access_token = ENV['OPENAI_API_KEY']
end
```

**Service Layer (Abstraction):**
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
    @client ||= LLM::OpenAIClient.new
  end
end

# app/services/llm/openai_client.rb
module LLM
  class OpenAIClient
    def parse_resume(text)
      response = OpenAI::Client.new.chat(
        parameters: {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: resume_parsing_prompt },
            { role: 'user', content: text }
          ],
          temperature: 0.3
        }
      )

      JSON.parse(response.dig('choices', 0, 'message', 'content'))
    rescue JSON::ParserError => e
      Rails.logger.error("Failed to parse LLM response: #{e.message}")
      raise
    end

    private

    def resume_parsing_prompt
      <<~PROMPT
        You are a resume parser. Extract the following information from the resume text and return it as a JSON object:

        {
          "personal_info": {
            "name": "string",
            "email": "string",
            "phone": "string",
            "location": "string",
            "linkedin": "string",
            "github": "string"
          },
          "summary": "string",
          "skills": [
            { "name": "string", "category": "string" }
          ],
          "experience": [
            {
              "company": "string",
              "title": "string",
              "location": "string",
              "start_date": "YYYY-MM",
              "end_date": "YYYY-MM or Present",
              "responsibilities": ["string"]
            }
          ],
          "education": [
            {
              "institution": "string",
              "degree": "string",
              "field": "string",
              "graduation_year": "YYYY"
            }
          ],
          "certifications": [...],
          "projects": [...]
        }

        Return ONLY the JSON object, no additional text.
      PROMPT
    end
  end
end
```

**Error Handling:**
- Retry logic for API failures (3 attempts)
- Timeout configuration (30 seconds)
- Cost tracking (log token usage)

---

### 7. Background Jobs

**Solid Queue (Rails 8 Built-in):**
- Database-backed job queue
- No Redis dependency

**Installation:**
```bash
rails solid_queue:install
rails db:migrate
```

**Job Definitions:**

```ruby
# app/jobs/parse_resume_job.rb
class ParseResumeJob < ApplicationJob
  queue_as :default
  retry_on OpenAI::Error, wait: :exponentially_longer, attempts: 3

  def perform(resume_id)
    resume = Resume.find(resume_id)
    resume.update!(status: 'processing')

    # Extract text
    text = FileProcessorService.extract_text(resume.file)

    # Parse with LLM
    parsed_data = LLMService.parse_resume(text)

    # Save results
    resume.update!(
      status: 'completed',
      parsed_data: parsed_data
    )
  rescue StandardError => e
    resume.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end
end
```

```ruby
# app/jobs/scrape_job_description_job.rb
class ScrapeJobDescriptionJob < ApplicationJob
  queue_as :default

  def perform(job_description_id)
    job_description = JobDescription.find(job_description_id)
    job_description.update!(status: 'scraping')

    # Scrape URL
    raw_text = WebScraperService.scrape(job_description.url)

    job_description.update!(
      raw_text: raw_text,
      status: 'parsing'
    )

    # Enqueue parsing job
    ParseJobDescriptionJob.perform_later(job_description_id)
  rescue StandardError => e
    job_description.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end
end

# app/jobs/parse_job_description_job.rb
class ParseJobDescriptionJob < ApplicationJob
  queue_as :default

  def perform(job_description_id)
    job_description = JobDescription.find(job_description_id)

    # Parse with LLM
    attributes = LLMService.parse_job_description(job_description.raw_text)

    job_description.update!(
      status: 'completed',
      title: attributes['title'],
      company_name: attributes['company'],
      attributes: attributes
    )
  rescue StandardError => e
    job_description.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end
end
```

---

### 8. Web Scraping

**Gems:**
```ruby
gem 'nokogiri'
gem 'httparty'
```

**Service Implementation:**
```ruby
# app/services/web_scraper_service.rb
class WebScraperService
  USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  ].freeze

  def self.scrape(url)
    response = HTTParty.get(url, headers: { 'User-Agent' => USER_AGENTS.sample })

    raise "HTTP Error: #{response.code}" unless response.success?

    doc = Nokogiri::HTML(response.body)
    extract_job_description(doc, url)
  end

  private

  def self.extract_job_description(doc, url)
    # Site-specific parsers
    case URI.parse(url).host
    when /linkedin\.com/
      extract_linkedin(doc)
    when /greenhouse\.io/
      extract_greenhouse(doc)
    when /lever\.co/
      extract_lever(doc)
    else
      extract_generic(doc)
    end
  end

  def self.extract_linkedin(doc)
    doc.css('.description__text').text.strip
  end

  def self.extract_greenhouse(doc)
    doc.css('#content').text.strip
  end

  def self.extract_lever(doc)
    doc.css('.posting-description').text.strip
  end

  def self.extract_generic(doc)
    # Fallback: try to find main content
    doc.css('body').text.strip
  end
end
```

---

### 9. API Structure

**Controllers:**
```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  before_action :authenticate_user!

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity

  private

  def not_found
    render json: { error: { message: 'Resource not found', code: 'NOT_FOUND' } },
           status: :not_found
  end

  def unprocessable_entity(exception)
    render json: {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: exception.record.errors.messages
      }
    }, status: :unprocessable_entity
  end
end

# app/controllers/api/v1/resumes_controller.rb
module Api
  module V1
    class ResumesController < ApplicationController
      def index
        resumes = current_user.resumes.order(created_at: :desc)
        render json: { data: resumes }, status: :ok
      end

      def show
        resume = current_user.resumes.find(params[:id])
        render json: { data: resume }, status: :ok
      end

      def create
        resume = current_user.resumes.create!(resume_params)
        render json: { data: resume }, status: :created
      end

      def destroy
        resume = current_user.resumes.find(params[:id])
        resume.destroy!
        head :no_content
      end

      private

      def resume_params
        params.require(:resume).permit(:name, :file)
      end
    end
  end
end
```

---

### 10. CORS Configuration

```ruby
# Gemfile
gem 'rack-cors'

# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins ENV.fetch('FRONTEND_URL', 'http://localhost:5173')

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

---

### 11. Environment Variables

**Required Variables:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/neoapply_development

# JWT Secret
JWT_SECRET_KEY=your-secret-key-here

# OpenAI
OPENAI_API_KEY=sk-...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rails
RAILS_ENV=development
RAILS_MAX_THREADS=5
```

**Management:**
```ruby
# Use dotenv gem for development
gem 'dotenv-rails', groups: [:development, :test]

# .env.example (commit to repo)
DATABASE_URL=postgresql://user:password@localhost:5432/neoapply_development
JWT_SECRET_KEY=change-me-in-production
OPENAI_API_KEY=your-api-key
FRONTEND_URL=http://localhost:5173
```

---

### 12. Validation & Error Handling

**Model Validations:**
```ruby
# app/models/resume.rb
class Resume < ApplicationRecord
  validates :name, presence: true
  validates :file, attached: true,
                   content_type: {
                     in: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                     message: 'must be PDF, DOCX, or TXT'
                   },
                   size: {
                     less_than: 10.megabytes,
                     message: 'must be less than 10 MB'
                   }
end
```

---

### 13. Testing Requirements

**RSpec:**
```ruby
# Gemfile
group :development, :test do
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'shoulda-matchers'
end

group :test do
  gem 'webmock'
  gem 'vcr'
end
```

**Test Coverage:**
- Models: validations, associations, scopes
- Services: LLM integration (mocked), file parsing
- Controllers: API endpoints (request specs)
- Jobs: background job behavior

---

### 14. Logging & Monitoring

**Logging:**
```ruby
# config/environments/production.rb
config.log_level = :info
config.log_tags = [:request_id]

# Custom logging
Rails.logger.info("Resume parsed: #{resume.id}")
```

**Error Tracking (Future):**
- Sentry or Rollbar integration

---

### 15. Performance Optimization

**Database Queries:**
- Use `includes` to avoid N+1 queries
- Add database indexes on foreign keys
- JSONB indexes for frequently queried fields

**Caching:**
```ruby
# Use Solid Cache (Rails 8)
Rails.cache.fetch("resume_#{id}", expires_in: 1.hour) do
  Resume.find(id)
end
```

---

### 16. Security Checklist

- [ ] JWT secrets stored securely (Rails credentials)
- [ ] CORS configured for specific frontend origin
- [ ] SQL injection prevention (use parameterized queries)
- [ ] File upload validation (type, size)
- [ ] Rate limiting on authentication endpoints
- [ ] HTTPS enforced in production
- [ ] Database credentials in environment variables
- [ ] Sensitive logs redacted (passwords, tokens)

---

### 17. Development Workflow

**Setup Commands:**
```bash
# Install dependencies
bundle install

# Setup database
rails db:create db:migrate db:seed

# Start server
rails server -p 3000

# Run background jobs
bundle exec solid_queue:start

# Run tests
bundle exec rspec
```

---

### 18. Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Assets precompiled (if any)
- [ ] Background job worker running
- [ ] HTTPS enabled
- [ ] Database backups scheduled
- [ ] Error monitoring enabled
- [ ] Log aggregation configured

---

### 19. Dependencies (Gemfile)

```ruby
source 'https://rubygems.org'

ruby '3.2.2'

# Core
gem 'rails', '~> 8.0'
gem 'pg', '~> 1.5'
gem 'puma', '>= 5.0'

# Authentication
gem 'devise'
gem 'devise-jwt'

# Background Jobs
gem 'solid_queue'

# File Processing
gem 'pdf-reader'
gem 'docx'

# LLM Integration
gem 'ruby-openai'

# Web Scraping
gem 'nokogiri'
gem 'httparty'

# CORS
gem 'rack-cors'

# Environment Variables
gem 'dotenv-rails', groups: [:development, :test]

group :development, :test do
  gem 'debug', platforms: %i[ mri windows ]
  gem 'rspec-rails'
  gem 'factory_bot_rails'
  gem 'faker'
end

group :test do
  gem 'shoulda-matchers'
  gem 'webmock'
  gem 'vcr'
end
```

---

Last Updated: 2025-11-04
