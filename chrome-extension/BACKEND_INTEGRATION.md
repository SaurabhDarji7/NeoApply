# Backend Integration Guide

This document outlines the backend changes needed to support the Chrome extension.

## New Models Required

### 1. AutofillProfile Model

```bash
rails generate model AutofillProfile user:references \
  first_name:string \
  last_name:string \
  email:string \
  phone:string \
  address:string \
  city:string \
  state:string \
  zip:string \
  country:string \
  linkedin:string \
  github:string \
  portfolio:string
```

**Model File:** `app/models/autofill_profile.rb`

```ruby
class AutofillProfile < ApplicationRecord
  belongs_to :user

  validates :first_name, :last_name, :email, presence: true
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :linkedin, :github, :portfolio, url: true, allow_blank: true

  # Auto-create profile when user signs up
  after_create :initialize_from_user

  private

  def initialize_from_user
    self.email ||= user.email
    save
  end
end
```

### 2. Application Model

```bash
rails generate model Application user:references \
  resume:references \
  company:string \
  role:string \
  url:string \
  ats_type:string \
  status:string \
  applied_at:datetime \
  source:string \
  notes:text
```

**Model File:** `app/models/application.rb`

```ruby
class Application < ApplicationRecord
  belongs_to :user
  belongs_to :resume, optional: true

  enum ats_type: {
    greenhouse: 'greenhouse',
    lever: 'lever',
    workday: 'workday',
    adp: 'adp',
    unknown: 'unknown'
  }

  enum status: {
    autofilled: 'autofilled',
    submitted: 'submitted',
    interviewing: 'interviewing',
    offered: 'offered',
    rejected: 'rejected',
    withdrawn: 'withdrawn'
  }

  validates :company, :role, :url, presence: true
  validates :url, format: { with: URI::DEFAULT_PARSER.make_regexp }

  scope :recent, -> { order(applied_at: :desc) }
  scope :by_ats, ->(ats) { where(ats_type: ats) }
end
```

## New Controllers

### 1. AutofillProfilesController

**File:** `app/controllers/api/v1/autofill_profiles_controller.rb`

```ruby
module Api
  module V1
    class AutofillProfilesController < ApplicationController
      before_action :authenticate_user!

      # GET /api/v1/autofill_profile
      def show
        profile = current_user.autofill_profile || current_user.build_autofill_profile

        render json: {
          profile: profile.as_json(except: [:id, :user_id, :created_at, :updated_at])
        }
      end

      # PUT /api/v1/autofill_profile
      def update
        profile = current_user.autofill_profile || current_user.create_autofill_profile

        if profile.update(profile_params)
          render json: {
            profile: profile.as_json(except: [:id, :user_id, :created_at, :updated_at]),
            message: 'Profile updated successfully'
          }
        else
          render json: {
            error: 'Failed to update profile',
            errors: profile.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      private

      def profile_params
        params.require(:profile).permit(
          :first_name, :last_name, :email, :phone,
          :address, :city, :state, :zip, :country,
          :linkedin, :github, :portfolio
        )
      end
    end
  end
end
```

### 2. ApplicationsController

**File:** `app/controllers/api/v1/applications_controller.rb`

```ruby
module Api
  module V1
    class ApplicationsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_application, only: [:show, :update, :destroy]

      # GET /api/v1/applications
      def index
        applications = current_user.applications.recent

        # Optional filters
        applications = applications.by_ats(params[:ats_type]) if params[:ats_type].present?
        applications = applications.where(status: params[:status]) if params[:status].present?

        render json: {
          applications: applications.as_json(
            include: :resume,
            methods: [:formatted_applied_at]
          )
        }
      end

      # GET /api/v1/applications/:id
      def show
        render json: {
          application: @application.as_json(include: :resume)
        }
      end

      # POST /api/v1/applications
      def create
        application = current_user.applications.build(application_params)
        application.applied_at ||= Time.current

        if application.save
          render json: {
            application: application.as_json,
            message: 'Application logged successfully'
          }, status: :created
        else
          render json: {
            error: 'Failed to create application',
            errors: application.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/applications/:id
      def update
        if @application.update(application_params)
          render json: {
            application: @application.as_json,
            message: 'Application updated successfully'
          }
        else
          render json: {
            error: 'Failed to update application',
            errors: @application.errors.full_messages
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/applications/:id
      def destroy
        @application.destroy
        head :no_content
      end

      private

      def set_application
        @application = current_user.applications.find(params[:id])
      end

      def application_params
        params.require(:application).permit(
          :company, :role, :url, :ats_type, :status,
          :used_resume_id, :applied_at, :source, :notes
        )
      end
    end
  end
end
```

### 3. AnswersController (AI Service)

**File:** `app/controllers/api/v1/answers_controller.rb`

```ruby
module Api
  module V1
    class AnswersController < ApplicationController
      before_action :authenticate_user!

      # POST /api/v1/answers/generate
      def generate
        job_text = params[:job_text]
        resume_id = params[:resume_id]
        fields_metadata = params[:fields_metadata] || []

        if job_text.blank?
          return render json: { error: 'Job text is required' }, status: :bad_request
        end

        resume = current_user.resumes.find_by(id: resume_id)
        unless resume
          return render json: { error: 'Resume not found' }, status: :not_found
        end

        # Generate tailored answers using AI
        service = TailoredAnswerService.new(
          job_text: job_text,
          resume: resume,
          fields_metadata: fields_metadata
        )

        suggestions = service.generate

        render json: {
          suggestions: suggestions,
          message: 'Suggestions generated successfully'
        }
      rescue StandardError => e
        render json: {
          error: 'Failed to generate suggestions',
          message: e.message
        }, status: :internal_server_error
      end
    end
  end
end
```

## New Service

### TailoredAnswerService

**File:** `app/services/tailored_answer_service.rb`

```ruby
class TailoredAnswerService
  def initialize(job_text:, resume:, fields_metadata: [])
    @job_text = job_text
    @resume = resume
    @fields_metadata = fields_metadata
  end

  def generate
    resume_text = extract_resume_text(@resume)

    @fields_metadata.map do |field|
      {
        field_label: field['label'],
        text: generate_answer_for_field(field, resume_text)
      }
    end
  end

  private

  def extract_resume_text(resume)
    # Get parsed content if available
    if resume.parsed_content.present?
      content = resume.parsed_content
      parts = [
        content['summary'],
        content['experience']&.map { |e| "#{e['title']} at #{e['company']}: #{e['description']}" }&.join("\n"),
        content['skills']&.join(', ')
      ].compact

      return parts.join("\n\n")
    end

    # Fallback: extract from file if no parsed content
    "Resume content not available"
  end

  def generate_answer_for_field(field, resume_text)
    label = field['label'].to_s.downcase
    max_length = field['maxLength']

    # Determine field type from label
    if label.include?('cover') || label.include?('letter')
      generate_cover_letter(resume_text, max_length)
    elsif label.include?('why') || label.include?('interested')
      generate_why_interested(resume_text, max_length)
    elsif label.include?('experience') || label.include?('background')
      generate_experience_summary(resume_text, max_length)
    else
      # Generic response
      generate_generic_answer(label, resume_text, max_length)
    end
  end

  def generate_cover_letter(resume_text, max_length)
    prompt = <<~PROMPT
      Write a concise cover letter paragraph based on this resume:

      #{resume_text}

      Job Description:
      #{@job_text}

      Requirements:
      - Be professional and enthusiastic
      - Highlight relevant skills and experience
      - Keep it under #{max_length || 500} characters
      - No greeting or signature, just the body paragraph
    PROMPT

    call_openai(prompt, max_length)
  end

  def generate_why_interested(resume_text, max_length)
    prompt = <<~PROMPT
      Explain why the candidate is interested in this role based on their background:

      Resume:
      #{resume_text}

      Job Description:
      #{@job_text}

      Requirements:
      - Be specific and genuine
      - Reference relevant experience
      - Keep it under #{max_length || 300} characters
    PROMPT

    call_openai(prompt, max_length)
  end

  def generate_experience_summary(resume_text, max_length)
    prompt = <<~PROMPT
      Summarize the candidate's relevant experience for this job:

      Resume:
      #{resume_text}

      Job Description:
      #{@job_text}

      Requirements:
      - Focus on most relevant experience
      - Be concise and impactful
      - Keep it under #{max_length || 400} characters
    PROMPT

    call_openai(prompt, max_length)
  end

  def generate_generic_answer(label, resume_text, max_length)
    prompt = <<~PROMPT
      Answer this question: "#{label}"

      Based on this resume:
      #{resume_text}

      For this job:
      #{@job_text}

      Requirements:
      - Be relevant and professional
      - Keep it under #{max_length || 300} characters
    PROMPT

    call_openai(prompt, max_length)
  end

  def call_openai(prompt, max_length)
    client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])

    response = client.chat(
      parameters: {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: [(max_length || 500) / 2, 200].max, # Rough token estimate
        temperature: 0.7
      }
    )

    text = response.dig('choices', 0, 'message', 'content')&.strip || ''

    # Truncate if needed
    if max_length && text.length > max_length
      text = text[0...max_length].strip + '...'
    end

    text
  rescue StandardError => e
    Rails.logger.error("OpenAI API error: #{e.message}")
    "Unable to generate suggestion at this time."
  end
end
```

## Routes Configuration

**File:** `config/routes.rb`

```ruby
namespace :api do
  namespace :v1 do
    # Existing routes...

    # Autofill profile
    resource :autofill_profile, only: [:show, :update]

    # Applications tracking
    resources :applications, only: [:index, :show, :create, :update, :destroy]

    # AI-generated answers
    post 'answers/generate', to: 'answers#generate'
  end
end
```

## Database Migrations

```bash
# Create autofill_profiles table
rails db:migrate

# Create applications table
rails db:migrate
```

## User Model Association

**File:** `app/models/user.rb`

```ruby
class User < ApplicationRecord
  # Existing associations
  has_many :resumes, dependent: :destroy
  has_many :job_descriptions, dependent: :destroy

  # New associations
  has_one :autofill_profile, dependent: :destroy
  has_many :applications, dependent: :destroy

  # Auto-create autofill profile on user creation
  after_create :create_default_autofill_profile

  private

  def create_default_autofill_profile
    create_autofill_profile(
      first_name: '',
      last_name: '',
      email: email
    )
  end
end
```

## CORS Configuration

**File:** `config/initializers/cors.rb`

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'chrome-extension://*' # Allows any extension (for development)
    # For production, use specific extension ID:
    # origins 'chrome-extension://your-extension-id-here'

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
```

## Testing the Integration

### 1. Create Test Data

```ruby
# In Rails console
user = User.first
profile = user.create_autofill_profile(
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '+1 (555) 123-4567',
  city: 'San Francisco',
  state: 'CA',
  linkedin: 'https://linkedin.com/in/johndoe'
)
```

### 2. Test API Endpoints

```bash
# Get autofill profile
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/autofill_profile

# Create application
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "application": {
      "company": "Acme Inc",
      "role": "Software Engineer",
      "url": "https://boards.greenhouse.io/acme/jobs/123456",
      "ats_type": "greenhouse",
      "status": "autofilled"
    }
  }' \
  http://localhost:3000/api/v1/applications

# Generate tailored answer
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_text": "We are looking for a senior software engineer...",
    "resume_id": 1,
    "fields_metadata": [
      {"label": "Cover Letter", "maxLength": 500}
    ]
  }' \
  http://localhost:3000/api/v1/answers/generate
```

## Deployment Checklist

- [ ] Run migrations
- [ ] Add OpenAI API key to environment variables
- [ ] Update CORS configuration with production extension ID
- [ ] Test all endpoints with Postman/curl
- [ ] Verify JWT authentication works
- [ ] Load test AI answer generation endpoint
- [ ] Monitor OpenAI API usage and costs
- [ ] Set up error tracking (Honeybadger)

## Cost Considerations

**OpenAI API:**
- GPT-4: ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
- Average cover letter: ~500 tokens input + 200 tokens output = ~$0.03 per generation
- Budget: Implement rate limiting (e.g., 10 generations per day per user)

**Recommendations:**
- Cache common job descriptions and answers
- Implement rate limiting
- Consider GPT-3.5-turbo for cost savings (10x cheaper)
- Monitor usage per user

---

**Integration Date**: January 5, 2025
**Backend Version**: Rails 8.0.4
**Required Gems**: `openai` (already installed)
