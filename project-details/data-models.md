# NeoApply - Data Models & Database Schema

## Overview
This document defines the database schema for NeoApply's MVP. We use PostgreSQL with JSONB columns for flexible, structured data storage.

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ email           │
│ encrypted_pwd   │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    │                                     │
┌───▼──────────────┐            ┌────────▼──────────┐
│    resumes       │            │ job_descriptions  │
│──────────────────│            │───────────────────│
│ id (PK)          │            │ id (PK)           │
│ user_id (FK)     │            │ user_id (FK)      │
│ name             │            │ url               │
│ parsed_data      │◄───┐       │ title             │
│ status           │    │       │ company_name      │
│ created_at       │    │       │ raw_text          │
│ updated_at       │    │       │ attributes        │
└──────────────────┘    │       │ status            │
                        │       │ created_at        │
                        │       │ updated_at        │
                        │       └───────────────────┘
                        │
                        │
              ┌─────────┴────────────┐
              │    applications      │
              │──────────────────────│
              │ id (PK)              │
              │ user_id (FK)         │
              │ resume_id (FK)       │
              │ job_description_id   │
              │ status               │
              │ notes                │
              │ created_at           │
              │ updated_at           │
              └──────────────────────┘

┌─────────────────────────────┐
│ active_storage_blobs        │
│─────────────────────────────│
│ id (PK)                     │
│ key                         │
│ filename                    │
│ content_type                │
│ metadata                    │
│ byte_size                   │
│ checksum                    │
│ created_at                  │
└──────────────┬──────────────┘
               │
               │ 1:1
               │
┌──────────────▼────────────────┐
│ active_storage_attachments    │
│───────────────────────────────│
│ id (PK)                       │
│ name                          │
│ record_type (Resume)          │
│ record_id (FK to resumes.id)  │
│ blob_id (FK)                  │
│ created_at                    │
└───────────────────────────────┘
```

---

## Table Definitions

### 1. users

**Purpose**: Store user account information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| email | string | NOT NULL, UNIQUE | User's email (login) |
| encrypted_password | string | NOT NULL | Devise encrypted password |
| reset_password_token | string | UNIQUE | For password reset |
| reset_password_sent_at | datetime | | Password reset timestamp |
| remember_created_at | datetime | | Remember me token timestamp |
| created_at | datetime | NOT NULL | Account creation timestamp |
| updated_at | datetime | NOT NULL | Last update timestamp |

**Indexes**
```sql
CREATE UNIQUE INDEX index_users_on_email ON users (email);
CREATE UNIQUE INDEX index_users_on_reset_password_token ON users (reset_password_token);
```

**Migration**
```ruby
class DeviseCreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false, default: ""
      t.string :encrypted_password, null: false, default: ""
      t.string :reset_password_token
      t.datetime :reset_password_sent_at
      t.datetime :remember_created_at
      t.timestamps null: false
    end

    add_index :users, :email, unique: true
    add_index :users, :reset_password_token, unique: true
  end
end
```

---

### 2. resumes

**Purpose**: Store uploaded resumes and their parsed data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | References users.id |
| name | string | NOT NULL | User-provided resume name |
| parsed_data | jsonb | | Structured resume data (see schema below) |
| status | string | NOT NULL, DEFAULT 'pending' | pending/processing/completed/failed |
| error_message | text | | Error details if parsing failed |
| created_at | datetime | NOT NULL | Upload timestamp |
| updated_at | datetime | NOT NULL | Last update timestamp |

**JSONB Schema: parsed_data**
```json
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string (URL)",
    "github": "string (URL)",
    "portfolio": "string (URL)"
  },
  "summary": "string (professional summary)",
  "skills": [
    {
      "name": "string",
      "category": "string (Frontend/Backend/Database/DevOps/Soft Skills)",
      "proficiency": "string (Beginner/Intermediate/Advanced) - optional"
    }
  ],
  "experience": [
    {
      "company": "string",
      "title": "string",
      "location": "string",
      "start_date": "string (YYYY-MM)",
      "end_date": "string (YYYY-MM or 'Present')",
      "duration": "string (calculated, e.g., '2 years 3 months')",
      "responsibilities": ["string"],
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "location": "string",
      "graduation_year": "string (YYYY)",
      "gpa": "string (optional)"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string (YYYY-MM)",
      "expiry_date": "string (YYYY-MM) - optional",
      "credential_id": "string - optional"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string (optional)"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "string (Native/Fluent/Professional/Basic)"
    }
  ]
}
```

**Indexes**
```sql
CREATE INDEX index_resumes_on_user_id ON resumes (user_id);
CREATE INDEX index_resumes_on_status ON resumes (status);
CREATE INDEX index_resumes_on_parsed_data ON resumes USING gin (parsed_data);
```

**Migration**
```ruby
class CreateResumes < ActiveRecord::Migration[8.0]
  def change
    create_table :resumes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.jsonb :parsed_data
      t.string :status, null: false, default: 'pending'
      t.text :error_message
      t.timestamps
    end

    add_index :resumes, :status
    add_index :resumes, :parsed_data, using: :gin
  end
end
```

---

### 3. job_descriptions

**Purpose**: Store job postings and their parsed attributes

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | References users.id |
| url | text | | Job posting URL (nullable if manually entered) |
| title | string | | Job title (extracted) |
| company_name | string | | Company name (extracted) |
| raw_text | text | | Full job description text |
| attributes | jsonb | | Parsed job attributes (see schema below) |
| status | string | NOT NULL, DEFAULT 'pending' | pending/scraping/parsing/completed/failed |
| error_message | text | | Error details if scraping/parsing failed |
| created_at | datetime | NOT NULL | Creation timestamp |
| updated_at | datetime | NOT NULL | Last update timestamp |

**JSONB Schema: attributes**
```json
{
  "title": "string",
  "company": "string",
  "location": "string",
  "remote_type": "string (Remote/Hybrid/On-site)",
  "job_type": "string (Full-time/Part-time/Contract/Internship)",
  "experience_level": "string (Entry/Junior/Mid/Senior/Lead)",
  "years_of_experience": "string (e.g., '1-2 years', '3+ years')",
  "education_requirement": "string",
  "salary_range": {
    "min": "number (integer)",
    "max": "number (integer)",
    "currency": "string (USD/EUR/etc.)",
    "period": "string (annual/monthly/hourly)"
  },
  "skills_required": [
    {
      "name": "string",
      "category": "string (Technical/Soft Skill)",
      "importance": "string (Required/Preferred)"
    }
  ],
  "skills_nice_to_have": ["string"],
  "responsibilities": ["string"],
  "qualifications": ["string"],
  "benefits": ["string"],
  "application_deadline": "string (YYYY-MM-DD)",
  "requires_bilingual": "boolean",
  "languages_required": ["string"],
  "industry": "string (FinTech/Healthcare/etc.)",
  "company_size": "string (1-10/11-50/51-200/etc.)",
  "visa_sponsorship": "boolean (if mentioned)",
  "security_clearance_required": "boolean",
  "travel_required": "string (None/Occasional/Frequent)"
}
```

**Indexes**
```sql
CREATE INDEX index_job_descriptions_on_user_id ON job_descriptions (user_id);
CREATE INDEX index_job_descriptions_on_status ON job_descriptions (status);
CREATE INDEX index_job_descriptions_on_company_name ON job_descriptions (company_name);
CREATE INDEX index_job_descriptions_on_attributes ON job_descriptions USING gin (attributes);
```

**Migration**
```ruby
class CreateJobDescriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :job_descriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.text :url
      t.string :title
      t.string :company_name
      t.text :raw_text
      t.jsonb :attributes
      t.string :status, null: false, default: 'pending'
      t.text :error_message
      t.timestamps
    end

    add_index :job_descriptions, :status
    add_index :job_descriptions, :company_name
    add_index :job_descriptions, :attributes, using: :gin
  end
end
```

---

### 4. applications

**Purpose**: Link resumes to job descriptions (MVP: basic tracking only)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | bigint | PRIMARY KEY | Auto-incrementing ID |
| user_id | bigint | NOT NULL, FOREIGN KEY | References users.id |
| resume_id | bigint | NOT NULL, FOREIGN KEY | References resumes.id |
| job_description_id | bigint | NOT NULL, FOREIGN KEY | References job_descriptions.id |
| status | string | NOT NULL, DEFAULT 'draft' | draft/applied/interview/rejected/offer/accepted |
| notes | text | | User's notes about application |
| applied_at | datetime | | When the application was submitted |
| created_at | datetime | NOT NULL | Record creation timestamp |
| updated_at | datetime | NOT NULL | Last update timestamp |

**Indexes**
```sql
CREATE INDEX index_applications_on_user_id ON applications (user_id);
CREATE INDEX index_applications_on_resume_id ON applications (resume_id);
CREATE INDEX index_applications_on_job_description_id ON applications (job_description_id);
CREATE INDEX index_applications_on_status ON applications (status);
CREATE UNIQUE INDEX index_applications_uniqueness ON applications (user_id, resume_id, job_description_id);
```

**Migration**
```ruby
class CreateApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :applications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :resume, null: false, foreign_key: true
      t.references :job_description, null: false, foreign_key: true
      t.string :status, null: false, default: 'draft'
      t.text :notes
      t.datetime :applied_at
      t.timestamps
    end

    add_index :applications, :status
    add_index :applications, [:user_id, :resume_id, :job_description_id],
              unique: true,
              name: 'index_applications_uniqueness'
  end
end
```

---

### 5. ActiveStorage Tables

Rails' built-in file storage system. Generated automatically by ActiveStorage.

**active_storage_blobs**
- Stores file metadata (filename, content_type, byte_size, checksum)

**active_storage_attachments**
- Polymorphic join table linking blobs to models (e.g., Resume)

**Migration**
```ruby
# Generated by: rails active_storage:install
class CreateActiveStorageTables < ActiveRecord::Migration[8.0]
  def change
    create_table :active_storage_blobs do |t|
      t.string :key, null: false
      t.string :filename, null: false
      t.string :content_type
      t.text :metadata
      t.bigint :byte_size, null: false
      t.string :checksum, null: false
      t.datetime :created_at, null: false
      t.index [:key], unique: true
    end

    create_table :active_storage_attachments do |t|
      t.string :name, null: false
      t.references :record, null: false, polymorphic: true, index: false
      t.references :blob, null: false
      t.datetime :created_at, null: false
      t.index [:record_type, :record_id, :name, :blob_id],
              name: 'index_active_storage_attachments_uniqueness',
              unique: true
    end

    add_foreign_key :active_storage_attachments, :active_storage_blobs, column: :blob_id
  end
end
```

---

## Model Associations

### User Model
```ruby
class User < ApplicationRecord
  # Devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :resumes, dependent: :destroy
  has_many :job_descriptions, dependent: :destroy
  has_many :applications, dependent: :destroy

  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
end
```

### Resume Model
```ruby
class Resume < ApplicationRecord
  belongs_to :user
  has_one_attached :file
  has_many :applications, dependent: :destroy

  # Validations
  validates :name, presence: true
  validates :status, presence: true,
            inclusion: { in: %w[pending processing completed failed] }
  validates :file, attached: true,
            content_type: ['application/pdf',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'text/plain'],
            size: { less_than: 10.megabytes }

  # Scopes
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks
  after_create :enqueue_parsing

  private

  def enqueue_parsing
    ParseResumeJob.perform_later(id)
  end
end
```

### JobDescription Model
```ruby
class JobDescription < ApplicationRecord
  belongs_to :user
  has_many :applications, dependent: :destroy

  # Validations
  validates :status, presence: true,
            inclusion: { in: %w[pending scraping parsing completed failed] }
  validate :url_or_raw_text_present

  # Scopes
  scope :completed, -> { where(status: 'completed') }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks
  after_create :enqueue_scraping

  private

  def url_or_raw_text_present
    if url.blank? && raw_text.blank?
      errors.add(:base, 'Either URL or raw text must be present')
    end
  end

  def enqueue_scraping
    if url.present?
      ScrapeJobDescriptionJob.perform_later(id)
    else
      ParseJobDescriptionJob.perform_later(id)
    end
  end
end
```

### Application Model
```ruby
class Application < ApplicationRecord
  belongs_to :user
  belongs_to :resume
  belongs_to :job_description

  # Validations
  validates :status, presence: true,
            inclusion: { in: %w[draft applied interview rejected offer accepted] }
  validates :resume_id, uniqueness: { scope: [:user_id, :job_description_id] }

  # Scopes
  scope :active, -> { where(status: %w[draft applied interview]) }
  scope :archived, -> { where(status: %w[rejected offer accepted]) }
  scope :by_status, ->(status) { where(status: status) }
end
```

---

## Querying JSONB Data

### Example Queries

**Find resumes with specific skill:**
```ruby
Resume.where("parsed_data->'skills' @> ?",
             [{ name: 'Ruby on Rails' }].to_json)
```

**Find jobs requiring specific experience level:**
```ruby
JobDescription.where("attributes->>'experience_level' = ?", 'Junior')
```

**Find jobs with salary range above threshold:**
```ruby
JobDescription.where("(attributes->'salary_range'->>'min')::int >= ?", 60000)
```

**Find jobs with specific required skills:**
```ruby
JobDescription.where("attributes->'skills_required' @> ?",
                     [{ name: 'JavaScript' }].to_json)
```

**Search resumes by email:**
```ruby
Resume.where("parsed_data->'personal_info'->>'email' = ?",
             'john@example.com')
```

---

## Database Performance Considerations

### JSONB Indexing
```sql
-- GIN index for containment queries
CREATE INDEX index_resumes_on_parsed_data ON resumes USING gin (parsed_data);

-- Index specific JSONB path (if frequently queried)
CREATE INDEX index_resumes_on_skills ON resumes USING gin ((parsed_data->'skills'));
```

### Query Optimization
- Use `pluck` instead of `map` for extracting single attributes
- Eager load associations with `includes` to avoid N+1 queries
- Use database-level constraints for data integrity

---

## Data Integrity & Constraints

### Foreign Keys
All foreign key relationships use `ON DELETE CASCADE` or `ON DELETE RESTRICT`:
- User deletion → cascades to resumes, job_descriptions, applications
- Resume deletion → cascades to applications
- JobDescription deletion → cascades to applications

### Unique Constraints
- `users.email` - Unique email per user
- `applications(user_id, resume_id, job_description_id)` - Prevent duplicate applications

### Check Constraints (Future)
```sql
ALTER TABLE job_descriptions
ADD CONSTRAINT check_url_or_text
CHECK (url IS NOT NULL OR raw_text IS NOT NULL);
```

---

## Seed Data (Development)

```ruby
# db/seeds.rb
user = User.create!(
  email: 'test@example.com',
  password: 'password123'
)

resume = user.resumes.create!(
  name: 'Software Engineer Resume',
  status: 'completed',
  parsed_data: {
    personal_info: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    skills: [
      { name: 'Ruby on Rails', category: 'Backend' },
      { name: 'Vue.js', category: 'Frontend' }
    ]
  }
)

job = user.job_descriptions.create!(
  title: 'Junior Developer',
  company_name: 'TechCorp',
  url: 'https://example.com/job/123',
  status: 'completed',
  attributes: {
    title: 'Junior Developer',
    experience_level: 'Junior',
    skills_required: [
      { name: 'JavaScript', importance: 'Required' }
    ]
  }
)
```

---

## Future Schema Additions (Phase 2+)

### Email Templates
```ruby
create_table :email_templates do |t|
  t.references :user, null: false, foreign_key: true
  t.string :name
  t.string :subject
  t.text :body
  t.jsonb :variables # e.g., {{recruiter_name}}, {{company}}
  t.timestamps
end
```

### Recruiter Contacts
```ruby
create_table :recruiter_contacts do |t|
  t.references :job_description, null: false, foreign_key: true
  t.string :name
  t.string :email
  t.string :linkedin_url
  t.string :title
  t.timestamps
end
```

### Outreach Log
```ruby
create_table :outreach_logs do |t|
  t.references :application, null: false, foreign_key: true
  t.string :channel # email, linkedin
  t.text :message_content
  t.datetime :sent_at
  t.boolean :response_received
  t.timestamps
end
```

---

Last Updated: 2025-11-04
