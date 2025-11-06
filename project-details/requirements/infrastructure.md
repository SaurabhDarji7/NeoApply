# NeoApply - Infrastructure Requirements

## Overview
NeoApply uses **Docker** for containerization, ensuring consistent development and production environments. This document covers Docker setup, development workflow, and deployment considerations.

---

## Docker Architecture

### Container Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                        │
│─────────────────────────────────────────────────────────│
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │  PostgreSQL  │ │
│  │              │  │              │  │              │ │
│  │  Vue.js SPA  │  │  Rails API   │  │  Database    │ │
│  │  Vite Dev    │  │  Puma Server │  │              │ │
│  │  Port: 5173  │  │  Port: 3000  │  │  Port: 5432  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Docker Compose Configuration

### Project Structure

```
NeoApply/
├── docker-compose.yml
├── .env
├── backend/
│   ├── Dockerfile
│   ├── Gemfile
│   ├── Gemfile.lock
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
└── project-details/
```

---

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: neoapply_db
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-neoapply_development}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - neoapply_network

  # Rails Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: neoapply_backend
    command: bash -c "rm -f tmp/pids/server.pid && bundle exec rails server -b 0.0.0.0"
    environment:
      DATABASE_URL: postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-postgres}@db:5432/${DB_NAME:-neoapply_development}
      RAILS_ENV: ${RAILS_ENV:-development}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:5173}
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - bundle_cache:/usr/local/bundle
      - rails_storage:/app/storage
    depends_on:
      db:
        condition: service_healthy
    networks:
      - neoapply_network
    stdin_open: true
    tty: true

  # Vue.js Frontend SPA
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: neoapply_frontend
    command: npm run dev -- --host 0.0.0.0
    environment:
      VITE_API_BASE_URL: ${VITE_API_BASE_URL:-http://localhost:3000/api/v1}
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - neoapply_network
    stdin_open: true
    tty: true

volumes:
  postgres_data:
  bundle_cache:
  rails_storage:

networks:
  neoapply_network:
    driver: bridge
```

---

## Dockerfiles

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM ruby:3.2.2-alpine

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata \
    git \
    nodejs \
    yarn

# Set working directory
WORKDIR /app

# Install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
```

---

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 5173

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

---

## Environment Variables

### .env File (Root)

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=neoapply_development

# Rails
RAILS_ENV=development
JWT_SECRET_KEY=your-secret-key-change-in-production

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

### .env.example (Commit to Repo)

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=neoapply_development

# Rails
RAILS_ENV=development
JWT_SECRET_KEY=change-me-in-production

# OpenAI
OPENAI_API_KEY=your-api-key-here

# Frontend
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## Docker Commands

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd NeoApply

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Build containers
docker-compose build

# Start services
docker-compose up
```

---

### Development Workflow

**Start all services:**
```bash
docker-compose up
```

**Start in detached mode:**
```bash
docker-compose up -d
```

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Stop services:**
```bash
docker-compose down
```

**Rebuild specific service:**
```bash
docker-compose build backend
docker-compose up -d backend
```

---

### Database Management

**Create database:**
```bash
docker-compose exec backend rails db:create
```

**Run migrations:**
```bash
docker-compose exec backend rails db:migrate
```

**Seed database:**
```bash
docker-compose exec backend rails db:seed
```

**Reset database:**
```bash
docker-compose exec backend rails db:reset
```

**Open PostgreSQL console:**
```bash
docker-compose exec db psql -U postgres -d neoapply_development
```

---

### Rails Commands

**Generate migration:**
```bash
docker-compose exec backend rails generate migration AddFieldToModel
```

**Open Rails console:**
```bash
docker-compose exec backend rails console
```

**Run tests:**
```bash
docker-compose exec backend bundle exec rspec
```

**Install new gem:**
```bash
# Add gem to Gemfile
docker-compose exec backend bundle install
docker-compose restart backend
```

---

### Frontend Commands

**Install npm package:**
```bash
docker-compose exec frontend npm install <package-name>
docker-compose restart frontend
```

**Run tests:**
```bash
docker-compose exec frontend npm run test
```

**Build for production:**
```bash
docker-compose exec frontend npm run build
```

---

## Volume Management

### Named Volumes

**postgres_data:**
- Persists PostgreSQL database
- Survives container restarts

**bundle_cache:**
- Caches Ruby gems
- Speeds up rebuilds

**rails_storage:**
- ActiveStorage uploaded files
- Persists across restarts

**View volumes:**
```bash
docker volume ls
```

**Remove volumes (WARNING: Deletes data):**
```bash
docker-compose down -v
```

---

## Networking

### Internal DNS

Containers can communicate using service names:
- Frontend → Backend: `http://backend:3000`
- Backend → Database: `postgresql://db:5432`

### Port Mapping

| Service | Internal Port | External Port | Access URL |
|---------|--------------|---------------|------------|
| Frontend | 5173 | 5173 | http://localhost:5173 |
| Backend | 3000 | 3000 | http://localhost:3000 |
| Database | 5432 | 5432 | localhost:5432 |

---

## Health Checks

### Database Health Check

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

This ensures backend waits for database to be ready before starting.

---

## Production Dockerfile Variants

### Backend Production Dockerfile

```dockerfile
# backend/Dockerfile.prod
FROM ruby:3.2.2-alpine AS builder

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata

WORKDIR /app

COPY Gemfile Gemfile.lock ./
RUN bundle install --without development test

COPY . .

# Production image
FROM ruby:3.2.2-alpine

RUN apk add --no-cache \
    postgresql-client \
    tzdata

WORKDIR /app

COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

---

### Frontend Production Dockerfile

```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Troubleshooting

### Common Issues

**1. Port already in use:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in docker-compose.yml
```

**2. Database connection refused:**
```bash
# Wait for database to be ready
docker-compose logs db

# Restart backend
docker-compose restart backend
```

**3. Permission errors (volumes):**
```bash
# Linux: Fix volume permissions
sudo chown -R $USER:$USER ./backend
```

**4. Out of disk space:**
```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

**5. Gem/npm install fails:**
```bash
# Rebuild without cache
docker-compose build --no-cache backend
docker-compose build --no-cache frontend
```

---

## Development Tools

### Docker Desktop

**Recommended:**
- Docker Desktop (macOS/Windows)
- Docker Engine + Docker Compose (Linux)

**Version Requirements:**
- Docker: 20.10+
- Docker Compose: 2.0+

---

### VS Code Integration

**Extensions:**
- Docker (by Microsoft)
- Remote - Containers

**Attach to running container:**
```bash
# Open VS Code inside container
code --folder-uri vscode-remote://attached-container+<container-id>/app
```

---

## CI/CD Considerations (Future)

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3.2.2
          bundler-cache: true

      - name: Run tests
        run: bundle exec rspec
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
```

---

## Deployment Options

### Option 1: Render (Recommended for MVP)

**Services:**
- Web Service (Backend): Ruby
- Static Site (Frontend): Node.js
- PostgreSQL Database

**Cost:** ~$7-25/month

---

### Option 2: Fly.io

**Advantages:**
- Docker-native deployment
- Global edge network
- Free tier available

**Deployment:**
```bash
fly launch
fly deploy
```

---

### Option 3: AWS ECS (Scalable)

**Setup:**
- ECR for Docker images
- ECS Fargate for containers
- RDS for PostgreSQL
- CloudFront for frontend

---

### Option 4: Heroku (Easiest)

**Setup:**
```bash
# Backend
heroku create neoapply-backend
heroku addons:create heroku-postgresql
git push heroku main

# Frontend
heroku create neoapply-frontend
heroku buildpacks:set heroku/nodejs
git push heroku main
```

---

## Security Considerations

### Development

- [ ] `.env` file in `.gitignore`
- [ ] Use `.env.example` for documentation
- [ ] No hardcoded secrets in code

### Production

- [ ] Use secrets management (AWS Secrets Manager, Vault)
- [ ] HTTPS enforced (SSL/TLS)
- [ ] Database encrypted at rest
- [ ] Regular security updates
- [ ] Firewall rules for database access

---

## Backup Strategy

### Development

```bash
# Backup database
docker-compose exec db pg_dump -U postgres neoapply_development > backup.sql

# Restore database
docker-compose exec -T db psql -U postgres neoapply_development < backup.sql
```

### Production

- Automated daily backups (e.g., RDS automated backups)
- Point-in-time recovery
- Cross-region replication (optional)

---

## Monitoring (Future)

### Application Monitoring

- **Sentry** - Error tracking
- **New Relic** - APM
- **Datadog** - Infrastructure monitoring

### Logging

- **LogDNA** / **Papertrail** - Centralized logs
- **ELK Stack** - Self-hosted

---

## Performance Optimization

### Docker Build Optimization

**Use multi-stage builds:**
```dockerfile
FROM ruby:3.2.2-alpine AS builder
# Build steps

FROM ruby:3.2.2-alpine
COPY --from=builder /app /app
```

**Layer caching:**
```dockerfile
# Copy dependency files first
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Then copy application code
COPY . .
```

**Use .dockerignore:**
```
# backend/.dockerignore
.git
.env
log/*
tmp/*
spec/
coverage/
```

---

## Scaling Considerations (Future)

### Horizontal Scaling

- Load balancer (Nginx, HAProxy)
- Multiple backend containers
- Shared PostgreSQL instance
- Redis for session storage

### Vertical Scaling

- Increase container CPU/memory
- Optimize database queries
- CDN for frontend assets

---

Last Updated: 2025-11-04
