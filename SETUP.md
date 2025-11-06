# NeoApply Setup Guide - Resume & Job Description Parsing MVP

## What's Been Implemented (Tasks 4-9)

### Backend Services ✅
- **Task 4**: File text extraction (PDF, DOCX, TXT parsers)
- **Task 5**: OpenAI LLM integration with abstraction layer
- **Task 6**: Resume parsing service with comprehensive prompt
- **Task 7**: Job description scraping and parsing service
- **Task 8**: Background job processing with Solid Queue
- **Task 9**: Frontend components and views

### Key Features
1. **Resume Parsing**: Upload resumes (PDF/DOCX/TXT) → Extract structured data using GPT-4
2. **Job Description Parsing**: Scrape URLs or paste text → Extract job requirements
3. **Background Processing**: Asynchronous parsing with real-time status updates
4. **Polling Mechanism**: Frontend automatically polls for completion

## Prerequisites

1. **Docker Desktop** installed and running
2. **OpenAI API Key** - Get from https://platform.openai.com/api-keys
3. **Git** (for version control)

## Setup Instructions

### Step 1: Configure Environment Variables

Edit `.env` file in the root directory:

```bash
# Required: Add your OpenAI API key
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Database (already configured)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=neoapply_development
DB_HOST=db

# Rails (already configured)
RAILS_ENV=development
RAILS_MAX_THREADS=5
JWT_SECRET_KEY=development-secret-key-change-in-production

# Frontend (already configured)
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### Step 2: Install Dependencies & Run Migrations

```bash
# Build and start all services
docker-compose build
docker-compose up -d

# Run database migrations
docker-compose exec backend rails db:create
docker-compose exec backend rails db:migrate

# Install frontend dependencies (if needed)
docker-compose exec frontend npm install
```

### Step 3: Verify Services

Check that all services are running:

```bash
docker-compose ps
```

You should see:
- `db` (PostgreSQL) - Port 5432
- `backend` (Rails) - Port 3000
- `frontend` (Vue) - Port 5173

### Step 4: Start Background Job Worker

The background job worker processes resume and job description parsing:

```bash
# In a new terminal
docker-compose exec backend bundle exec rails solid_queue:start
```

Alternatively, you can run it as a separate service (recommended). Add to `docker-compose.yml`:

```yaml
worker:
  build: ./backend
  command: bundle exec rails solid_queue:start
  volumes:
    - ./backend:/app
  depends_on:
    - db
  env_file:
    - .env
  environment:
    - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}
```

Then restart:

```bash
docker-compose up -d worker
```

### Step 5: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/up

## Usage

### 1. Register/Login
Navigate to http://localhost:5173 and create an account

### 2. Upload a Resume
1. Go to "Resumes" section
2. Click "Upload Resume"
3. Select a PDF, DOCX, or TXT file (< 10 MB)
4. Give it a name
5. Watch as it processes in the background
6. View parsed data once complete

### 3. Add a Job Description
1. Go to "Jobs" section
2. Click "Add Job"
3. Either:
   - Paste a job URL (LinkedIn, Indeed, Greenhouse, etc.)
   - Paste raw job description text
4. Watch as it scrapes and parses
5. View structured job data once complete

## File Structure

```
NeoApply/
├── backend/
│   ├── app/
│   │   ├── controllers/api/v1/
│   │   │   ├── job_descriptions_controller.rb
│   │   │   └── resumes_controller.rb (existing)
│   │   ├── models/
│   │   │   ├── job_description.rb
│   │   │   ├── resume.rb (existing)
│   │   │   └── user.rb (existing)
│   │   ├── services/
│   │   │   ├── file_processor_service.rb
│   │   │   ├── llm_service.rb
│   │   │   ├── llm/openai_client.rb
│   │   │   ├── resume_parser_service.rb
│   │   │   ├── job_parser_service.rb
│   │   │   └── web_scraper_service.rb
│   │   ├── jobs/
│   │   │   ├── parse_resume_job.rb
│   │   │   └── scrape_and_parse_job_job.rb
│   │   └── lib/parsers/
│   │       ├── pdf_parser.rb
│   │       ├── docx_parser.rb
│   │       └── text_parser.rb
│   └── db/migrate/
│       ├── 20251104000004_create_job_descriptions.rb
│       └── 20251104000005_create_solid_queue_tables.rb
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── common/
│       │   │   ├── LoadingStates.vue
│       │   │   └── ErrorDisplay.vue
│       │   ├── resume/
│       │   │   └── ParsedResumeDisplay.vue
│       │   └── job/
│       │       └── ParsedJobDisplay.vue
│       ├── views/
│       │   ├── ResumeDetailView.vue (existing)
│       │   └── JobDetailView.vue
│       ├── stores/
│       │   ├── resume.js (updated with polling)
│       │   └── jobDescription.js
│       └── services/
│           ├── resumeService.js (existing)
│           └── jobDescriptionService.js
│
├── .env
├── docker-compose.yml
└── SETUP.md (this file)
```

## Testing

### Test Resume Parsing

1. Create test files in `backend/spec/fixtures/files/`:
   - `sample_resume.pdf`
   - `sample_resume.docx`
   - `sample_resume.txt` ✅ (already created)

2. Upload through the UI and verify parsing accuracy

### Test Job Description Scraping

Try various job board URLs:
- LinkedIn: https://www.linkedin.com/jobs/view/...
- Indeed: https://www.indeed.com/viewjob?jk=...
- Greenhouse: https://boards.greenhouse.io/...

### Manual API Testing

```bash
# Create a job description
curl -X POST http://localhost:3000/api/v1/job_descriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": {
      "url": "https://example.com/job",
      "raw_text": "Optional: paste job text here"
    }
  }'

# Check status
curl http://localhost:3000/api/v1/job_descriptions/:id/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Background Jobs Not Processing

Check if Solid Queue worker is running:

```bash
docker-compose logs -f backend | grep "Solid Queue"
```

If not running, start it manually:

```bash
docker-compose exec backend bundle exec rails solid_queue:start
```

### OpenAI API Errors

- Verify your API key is correct in `.env`
- Check you have credits: https://platform.openai.com/usage
- Try switching to `gpt-3.5-turbo` for testing (cheaper):
  Edit `backend/app/services/llm/openai_client.rb` and change `model: 'gpt-4'` to `model: 'gpt-3.5-turbo'`

### File Upload Errors

- Check file size is under 10 MB
- Verify file type is PDF, DOCX, or TXT
- Check ActiveStorage is configured: `docker-compose exec backend rails active_storage:install`

### Database Connection Issues

```bash
# Recreate database
docker-compose exec backend rails db:drop db:create db:migrate
```

## Next Steps (Out of Scope for MVP)

- [ ] Resume editing/customization
- [ ] Job-resume matching score calculation
- [ ] Application tracking
- [ ] Email/LinkedIn automation
- [ ] Recruiter discovery
- [ ] Multiple resume versions
- [ ] Advanced analytics

## Cost Estimates

### OpenAI API Costs (GPT-4)

- Resume parsing: ~$0.02-0.05 per resume
- Job description parsing: ~$0.01-0.03 per job
- Testing budget: $20-50 should cover development

To reduce costs during development:
1. Use `gpt-3.5-turbo` instead of `gpt-4` (10x cheaper)
2. Cache parsed results
3. Use test mode with mocked responses

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review error messages in the UI
3. Check database: `docker-compose exec backend rails console`

---

**Status**: Implementation complete for Tasks 4-9 ✅
**Next**: Run migrations and end-to-end testing
