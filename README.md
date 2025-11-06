# NeoApply - Intelligent Job Application Platform

An intelligent job application solution built for entry-level professionals. Simplifies the custom application process with automated resume parsing, job description analysis, and smart matching.

## Tech Stack

- **Backend**: Ruby on Rails 8 (API-only)
- **Frontend**: Vue.js 3 + Vite
- **Database**: PostgreSQL 15
- **LLM**: OpenAI GPT-4
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- OpenAI API key

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd NeoApply
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
OPENAI_API_KEY=sk-your-actual-key-here
```

### 3. Build and start the application

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up
```

### 4. Set up the database

In a new terminal:

```bash
# Create database
docker-compose exec backend rails db:create

# Run migrations
docker-compose exec backend rails db:migrate

# (Optional) Seed database
docker-compose exec backend rails db:seed
```

### 5. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/up

## Development Commands

### Backend (Rails)

```bash
# Run Rails console
docker-compose exec backend rails console

# Run migrations
docker-compose exec backend rails db:migrate

# Run tests
docker-compose exec backend bundle exec rspec

# View logs
docker-compose logs -f backend
```

### Frontend (Vue.js)

```bash
# Install new package
docker-compose exec frontend npm install <package-name>

# Run tests
docker-compose exec frontend npm run test

# View logs
docker-compose logs -f frontend
```

### Database

```bash
# Open PostgreSQL console
docker-compose exec db psql -U postgres -d neoapply_development

# Reset database
docker-compose exec backend rails db:reset
```

### Docker

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# View all logs
docker-compose logs -f
```

## Project Structure

```
NeoApply/
├── backend/              # Rails API
│   ├── app/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   └── jobs/
│   ├── config/
│   ├── db/
│   └── Dockerfile
├── frontend/             # Vue.js SPA
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── stores/
│   │   ├── services/
│   │   └── router/
│   └── Dockerfile
├── project-details/      # Documentation
│   ├── tech-stack.md
│   ├── architecture.md
│   ├── mvp-scope.md
│   ├── current-scope.md
│   └── requirements/
├── docker-compose.yml
├── .env
└── README.md
```

## Current Development Status

**Phase**: Tasks 4-10 Complete ✅ - MVP Ready for Testing!

### ✅ Completed Tasks

- ✅ **Task 1-3**: Project setup, authentication, resume upload (Previous)
- ✅ **Task 4**: File text extraction (PDF, DOCX, TXT parsers)
- ✅ **Task 5**: OpenAI LLM integration with abstraction layer
- ✅ **Task 6**: Resume parsing service with comprehensive prompts
- ✅ **Task 7**: Job description scraping and parsing
- ✅ **Task 8**: Background job processing with Solid Queue
- ✅ **Task 9**: Frontend display components (Resume/Job views, Loading/Error states)
- ✅ **Task 10**: Documentation and testing checklist

See `project-details/current-scope.md` for detailed task breakdown.

### 📁 Additional Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[TESTING-CHECKLIST.md](TESTING-CHECKLIST.md)** - Comprehensive testing guide
- **[START.bat](START.bat)** / **[START.sh](START.sh)** - Quick start scripts

### 🎯 Key Features

1. **Resume Parsing** - Upload PDF/DOCX/TXT → Extract structured data with GPT-4
2. **Job Description Parsing** - Scrape URLs or paste text → Extract requirements and skills
3. **Background Processing** - Non-blocking async parsing with real-time status updates
4. **Intelligent Polling** - Frontend automatically polls every 2s until completion
5. **Beautiful UI** - Vue 3 components with Tailwind CSS styling

### 🚀 Quick Start (Updated)

For Windows users, simply run:
```bash
START.bat
```

Then in a new terminal, start the background worker:
```bash
docker-compose exec backend bundle exec rails solid_queue:start
```

Access the app at http://localhost:5173

### 💡 What You Can Do Now

1. **Upload Resumes** - Parse personal info, skills, experience, education, certifications
2. **Add Job Descriptions** - Scrape from LinkedIn/Indeed/Greenhouse or paste text
3. **View Parsed Data** - Beautiful formatted display with all extracted information
4. **Monitor Processing** - Real-time status updates in the UI

### 📊 Cost Estimates

- Resume parsing (GPT-4): $0.02-0.05 per resume
- Job parsing (GPT-4): $0.01-0.03 per job
- Development budget: $20-50 recommended

💡 **Tip**: Use `gpt-3.5-turbo` during testing (10x cheaper)

## Next Steps (Future Enhancements)

1. Resume editing and customization
2. Job-resume matching score calculation
3. Application tracking system
4. Email and LinkedIn automation
5. Recruiter discovery and outreach
6. Multiple resume versions
7. Advanced analytics dashboard

## Contributing

This is currently a solo development project. Feature requests and bug reports are welcome!

## License

Private project - All rights reserved

---

Last Updated: 2025-11-04
