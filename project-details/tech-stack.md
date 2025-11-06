# NeoApply - Technology Stack

## Overview
NeoApply is built as a modern, scalable web application using a decoupled architecture with a Vue.js frontend and Rails API backend.

---

## Frontend Stack

### Core Framework
- **Vue.js 3** (Composition API)
  - Modern, reactive framework
  - Excellent for building clean, functional UIs
  - Strong TypeScript support
  - Smaller bundle size compared to React/Angular

### Build Tool
- **Vite**
  - Fast hot module replacement (HMR)
  - Optimized production builds
  - Native ES modules support

### State Management
- **Pinia**
  - Official Vue state management
  - Simpler than Vuex
  - TypeScript friendly

### HTTP Client
- **Axios**
  - Promise-based HTTP client
  - Interceptors for auth tokens
  - Easy error handling

### UI Framework (Optional)
- **Tailwind CSS** or **Vuetify**
  - Tailwind: Utility-first, minimal, customizable
  - Vuetify: Material Design components (if you want pre-built components)
  - Recommendation: **Tailwind CSS** for minimal, clutter-free UI

### Form Handling
- **VeeValidate**
  - Form validation
  - Works well with Yup/Zod schemas

---

## Backend Stack

### Core Framework
- **Ruby on Rails 8.x** (API mode)
  - Latest stable version
  - Built-in features: Solid Queue, Solid Cache
  - Mature ecosystem
  - Convention over configuration

### Authentication
- **Devise** + **Devise-JWT**
  - Industry-standard authentication
  - JWT tokens for API authentication
  - Secure session management

### File Processing
- **ActiveStorage**
  - Rails-native file uploads
  - Local storage initially
  - Easy migration to S3/cloud storage later

### Document Parsing
- **Apache Tika** (via REST API) or **Gems**:
  - **pdf-reader** - PDF parsing
  - **docx** - DOCX parsing
  - **rtf** - RTF support
  - Text files: native Ruby File I/O

### Background Jobs
- **Sidekiq** (Rails 8 built-in)
  - Database-backed job queue

### LLM Integration
- **OpenAI Ruby Gem** (`ruby-openai`)
  - GPT-5 API integration
  - Abstraction layer for future model switching:
    ```ruby
    # app/services/llm_service.rb
    class LLMService
      def self.parse_resume(text)
        # Swappable implementation
      end
    end
    ```

### Web Scraping (Future)
- **Nokogiri** - HTML parsing
- **HTTParty** - HTTP requests
- **Selenium** or **Ferrum** - Browser automation (for JS-heavy sites)

---

## Database

### Primary Database
- **PostgreSQL 15+**
  - JSONB support for structured resume/job data
  - Full-text search capabilities
  - Rock-solid reliability
  - Excellent Rails integration

### Schema Design Considerations
- Use JSONB columns for parsed resume/job description data
- Indexes on frequently queried fields
- Foreign keys for referential integrity

---

## Infrastructure & DevOps

### Containerization
- **Docker**
  - Separate containers for:
    - Rails API
    - PostgreSQL
    - Vue.js dev server (development)
    - Nginx (production, serving Vue SPA)

- **Docker Compose**
  - Orchestrate multi-container setup
  - Environment variable management
  - Volume management for persistence

### Development Environment
```yaml
services:
  - postgres (PostgreSQL 15)
  - backend (Rails API)
  - frontend (Vue + Vite dev server)
```

### Production Considerations (Future)
- Nginx for serving Vue SPA
- Puma web server for Rails
- Environment-based configuration
- SSL/TLS certificates

---

## API Design

### Architecture Pattern
- **RESTful API**
  - Clear resource-based endpoints
  - Standard HTTP methods (GET, POST, PUT, DELETE)
  - JSON request/response format

### Authentication Flow
- JWT tokens in Authorization header
- Token refresh mechanism
- CORS configuration for SPA

---

## Code Organization

### Backend Structure
```
backend/
├── app/
│   ├── controllers/api/v1/
│   ├── models/
│   ├── services/
│   │   ├── llm_service.rb
│   │   ├── resume_parser.rb
│   │   └── job_description_parser.rb
│   ├── serializers/
│   └── jobs/
├── config/
├── db/
└── spec/ (RSpec tests)
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   ├── views/
│   ├── stores/ (Pinia)
│   ├── services/
│   │   └── api.js
│   ├── router/
│   └── assets/
├── public/
└── tests/
```

---

## Testing Strategy

### Backend
- **RSpec** - Unit and integration tests
- **FactoryBot** - Test data generation
- **Shoulda Matchers** - Rails-specific matchers

### Frontend
- **Vitest** - Unit testing (Vite-native)
- **Vue Test Utils** - Component testing
- **Cypress** (optional) - E2E testing

---

## Version Control & Development Workflow

### Git Strategy
- Main branch: production-ready code
- Feature branches: individual features
- Pull request workflow

### Environment Variables
- `.env` files for local development
- Docker secrets for sensitive data
- Separate configs for dev/test/production

---

## Extensibility Principles

### LLM Abstraction
```ruby
# Easy to swap OpenAI for Claude, Gemini, etc.
class LLMService
  def self.client
    case ENV['LLM_PROVIDER']
    when 'openai'
      OpenAIClient.new
    when 'anthropic'
      AnthropicClient.new
    end
  end
end
```

### Parser Abstraction
```ruby
# Easy to add new resume formats
class ResumeParser
  def self.parse(file)
    case file.content_type
    when 'application/pdf'
      PdfParser.parse(file)
    when 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      DocxParser.parse(file)
    when 'text/plain'
      TextParser.parse(file)
    end
  end
end
```

---


### Database Optimization
- Proper indexing
- Query optimization with `includes`/`joins`
- JSONB indexing for metadata queries

---

## Security Considerations

### API Security
- CORS configuration
- JWT token expiration
- Rate limiting (rack-attack gem)
- Input validation and sanitization

### File Upload Security
- File type validation
- Size limits
- Virus scanning (future consideration)
- Secure storage paths

---

## Third-Party Services

### Current
- **OpenAI API** - LLM processing

---

## Cost Considerations

### Development (Free/Low Cost)
- PostgreSQL: Local Docker container
- ActiveStorage: Local filesystem
- OpenAI: Pay-per-use (reasonable for MVP)

### Production Scaling
- Database hosting: Render/Heroku PostgreSQL
- File storage: S3/GCS
- API hosting: Render/Fly.io/Railway
- Frontend: Netlify/Vercel (free tier)

---

## Why This Stack?

✅ **Rails 8**: Mature, productive, built-in features reduce dependencies
✅ **Vue.js 3**: Lightweight, performant, great for functional UIs
✅ **PostgreSQL**: Industry-standard, excellent JSON support
✅ **Docker**: Consistent dev/prod environments
✅ **OpenAI**: Best-in-class LLM for parsing/extraction tasks
✅ **JWT Auth**: Stateless, perfect for SPA architecture
✅ **Extensible Design**: Easy to swap components as requirements evolve

---

Last Updated: 2025-11-04
