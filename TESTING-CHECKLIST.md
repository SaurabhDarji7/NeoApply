# NeoApply Testing Checklist

## Pre-Testing Setup

### ✅ Configuration
- [ ] OpenAI API key added to `.env`
- [ ] Docker Desktop running
- [ ] Services started (`docker-compose up -d`)
- [ ] Database created and migrated (`rails db:create db:migrate`)
- [ ] Background worker running (`bundle exec rails solid_queue:start`)

### ✅ Service Health Check
```bash
# Check all services are running
docker-compose ps

# Expected output:
# db       - Up (5432)
# backend  - Up (3000)
# frontend - Up (5173)

# Test backend health
curl http://localhost:3000/up
# Expected: Status 200

# Test frontend
curl http://localhost:5173
# Expected: Vue app HTML
```

---

## Task 4: File Text Extraction

### Test PDF Parser
- [ ] Create a test PDF file or use an existing resume PDF
- [ ] Test in Rails console:
```ruby
docker-compose exec backend rails console

# Test PDF parsing
file_path = Rails.root.join('spec/fixtures/files/sample.pdf')
text = PdfParser.extract(file_path)
puts text.length # Should be > 0
```

### Test DOCX Parser
- [ ] Create a test DOCX file
- [ ] Test in Rails console:
```ruby
file_path = Rails.root.join('spec/fixtures/files/sample.docx')
text = DocxParser.extract(file_path)
puts text.length # Should be > 0
```

### Test TXT Parser
- [ ] Test with provided `sample_resume.txt`:
```ruby
file_path = Rails.root.join('spec/fixtures/files/sample_resume.txt')
text = TextParser.extract(file_path)
puts text.length # Should be > 1000 characters
```

---

## Task 5: OpenAI LLM Integration

### Test API Connection
```ruby
docker-compose exec backend rails console

client = LLM::OpenAIClient.new
# Should not raise error if API key is valid
```

### Test Resume Parsing
```ruby
sample_text = "John Doe\nSoftware Engineer\njohn@example.com\n\nSKILLS: Ruby, Rails, JavaScript"
result = LLMService.parse_resume(sample_text)
puts result.class # Should be Hash
puts result.keys # Should include: personal_info, skills, experience, education
```

### Test Job Description Parsing
```ruby
job_text = "Software Engineer\n\nCompany: TechCorp\nLocation: San Francisco\n\nRequired Skills: Ruby on Rails, PostgreSQL"
result = LLMService.parse_job_description(job_text)
puts result.keys # Should include: title, company, skills_required, etc.
```

---

## Task 6: Resume Parsing Service

### Test End-to-End Resume Parsing
```ruby
docker-compose exec backend rails console

# Create a test user first
user = User.create!(email: 'test@example.com', password: 'password123')

# Create resume (you'll need to attach a file manually or use ActiveStorage)
resume = user.resumes.create!(
  name: 'Test Resume',
  status: 'pending'
)

# Attach file (example with TXT)
resume.file.attach(
  io: File.open(Rails.root.join('spec/fixtures/files/sample_resume.txt')),
  filename: 'sample_resume.txt',
  content_type: 'text/plain'
)

# Manually trigger parsing
service = ResumeParserService.new(resume)
result = service.parse

puts result.dig('personal_info', 'name') # Should extract name
puts result['skills'].count # Should have multiple skills
```

---

## Task 7: Job Description Parsing

### Test Web Scraping
```ruby
docker-compose exec backend rails console

# Test with a real job URL (use a simple, accessible one)
url = "https://example-job-board.com/job/123"
text = WebScraperService.scrape(url)
puts text.length # Should be > 100
```

### Test Job Parser Service
```ruby
# Create job description
user = User.first
job = user.job_descriptions.create!(
  raw_text: "Software Engineer position at TechCorp...",
  status: 'pending'
)

# Parse
service = JobParserService.new(job)
result = service.parse

puts result['title'] # Should extract job title
puts result['company'] # Should extract company name
```

---

## Task 8: Background Job Processing

### Test Job Queue
```bash
# Check Solid Queue tables exist
docker-compose exec backend rails console

SolidQueue::Job.count # Should return 0 or number of jobs
```

### Test Resume Background Job
```bash
# Upload a resume via UI, then check:
docker-compose exec backend rails console

Resume.last.status # Should transition: pending -> processing -> completed
```

### Monitor Job Processing
```bash
# Watch logs
docker-compose logs -f backend | grep "Performing"

# Check job status
docker-compose exec backend rails console

# See all jobs
SolidQueue::Job.all.pluck(:class_name, :finished_state)
```

---

## Task 9: Frontend Components

### Test ParsedResumeDisplay
- [ ] Upload a resume via UI
- [ ] Wait for parsing to complete
- [ ] Verify all sections display correctly:
  - [ ] Personal information with copy-to-clipboard
  - [ ] Professional summary
  - [ ] Skills grouped by category with colors
  - [ ] Experience with timeline
  - [ ] Education
  - [ ] Certifications
  - [ ] Projects
  - [ ] Languages

### Test ParsedJobDisplay
- [ ] Add a job description via UI
- [ ] Wait for scraping/parsing to complete
- [ ] Verify all sections display:
  - [ ] Job header with title, company, location
  - [ ] Salary range (if available)
  - [ ] Required skills with "Required" badge
  - [ ] Nice-to-have skills with "Bonus" badge
  - [ ] Responsibilities
  - [ ] Qualifications
  - [ ] Benefits
  - [ ] Additional info (experience, education, visa, etc.)

### Test LoadingStates
- [ ] Upload resume - should show "Parsing in progress"
- [ ] Add job with URL - should show "Scraping job description"
- [ ] Verify spinner animations work
- [ ] Check skeleton loader on page load

### Test ErrorDisplay
- [ ] Upload corrupted file - should show error with suggestions
- [ ] Add invalid URL - should show error with retry button
- [ ] Click retry button - should attempt again

---

## Task 10: End-to-End Testing

### User Registration & Authentication
- [ ] Go to http://localhost:5173
- [ ] Click "Register"
- [ ] Create account with email/password
- [ ] Verify redirect to dashboard
- [ ] Logout
- [ ] Login again with same credentials

### Resume Upload Flow
1. **Upload Resume**
   - [ ] Click "Resumes" in navigation
   - [ ] Click "Upload Resume" button
   - [ ] Select a PDF/DOCX/TXT file (< 10 MB)
   - [ ] Give it a name
   - [ ] Click "Upload"

2. **Monitor Processing**
   - [ ] Should see "Processing..." status immediately
   - [ ] Status should update automatically (polling every 2s)
   - [ ] After ~10-30s, status should be "Completed"

3. **View Parsed Data**
   - [ ] Click on the completed resume
   - [ ] Verify all data sections display
   - [ ] Test copy-to-clipboard for email/phone
   - [ ] Download resume file
   - [ ] Delete resume

### Job Description Flow
1. **Add Job via URL**
   - [ ] Click "Jobs" in navigation
   - [ ] Click "Add Job" button
   - [ ] Paste a job URL (LinkedIn, Indeed, etc.)
   - [ ] Click "Add Job"

2. **Monitor Processing**
   - [ ] Should see "Scraping..." status
   - [ ] Then "Parsing..." status
   - [ ] After ~15-45s, status should be "Completed"

3. **View Parsed Data**
   - [ ] Click on the completed job
   - [ ] Verify all sections populated
   - [ ] Check skills are categorized
   - [ ] Verify salary if present
   - [ ] Delete job

4. **Add Job via Text**
   - [ ] Click "Add Job"
   - [ ] Paste job description text directly
   - [ ] Verify it skips scraping and goes straight to parsing

### Edge Cases
- [ ] Upload file > 10 MB - should reject
- [ ] Upload unsupported format - should reject
- [ ] Add job with broken URL - should fail gracefully
- [ ] Upload resume while offline - should show network error
- [ ] Leave page while processing - should stop polling

### Performance Testing
- [ ] Upload 3 resumes simultaneously
- [ ] All should process in background
- [ ] Status updates should work for all
- [ ] No UI freezing or lag

### Error Recovery
- [ ] Stop background worker
- [ ] Upload resume
- [ ] Should remain in "pending" state
- [ ] Start worker again
- [ ] Job should process automatically

---

## Browser Testing

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Responsive design works

### Firefox
- [ ] All features work
- [ ] No console errors

### Safari (if available)
- [ ] All features work
- [ ] No console errors

### Mobile Responsive
- [ ] Test on mobile viewport (DevTools)
- [ ] Navigation works
- [ ] Forms are usable
- [ ] Cards display properly

---

## API Testing (Optional)

### Test with cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"api@test.com","password":"password123"}}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"user":{"email":"api@test.com","password":"password123"}}'
```

**Get Resumes:**
```bash
curl http://localhost:3000/api/v1/resumes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Job Description:**
```bash
curl -X POST http://localhost:3000/api/v1/job_descriptions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_description":{"url":"https://example.com/job"}}'
```

**Check Job Status:**
```bash
curl http://localhost:3000/api/v1/job_descriptions/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Common Issues & Solutions

### Issue: Background jobs not processing
**Solution:**
```bash
# Check if worker is running
docker-compose logs backend | grep "Solid Queue"

# Start worker manually
docker-compose exec backend bundle exec rails solid_queue:start
```

### Issue: OpenAI API errors
**Solution:**
- Check API key in `.env`
- Verify account has credits: https://platform.openai.com/usage
- Try `gpt-3.5-turbo` instead of `gpt-4`

### Issue: File upload errors
**Solution:**
- Check file size < 10 MB
- Verify file type (PDF, DOCX, TXT only)
- Check ActiveStorage is configured

### Issue: Database errors
**Solution:**
```bash
docker-compose exec backend rails db:drop db:create db:migrate
```

### Issue: Frontend not updating
**Solution:**
```bash
docker-compose exec frontend npm install
docker-compose restart frontend
```

---

## Performance Benchmarks

### Expected Processing Times
- **Resume Parsing (GPT-4):** 10-30 seconds
- **Resume Parsing (GPT-3.5-turbo):** 5-15 seconds
- **Job Scraping:** 2-10 seconds
- **Job Parsing (GPT-4):** 5-20 seconds
- **Job Parsing (GPT-3.5-turbo):** 3-10 seconds

### Expected Costs (GPT-4)
- **Resume:** $0.02-0.05 per parse
- **Job:** $0.01-0.03 per parse
- **Testing (50 resumes + 50 jobs):** ~$3-8

---

## Final Checks

- [ ] All services start without errors
- [ ] Can register and login
- [ ] Can upload and parse resumes
- [ ] Can add and parse job descriptions
- [ ] Polling works (auto-updates status)
- [ ] Error states show helpful messages
- [ ] Loading states are smooth
- [ ] Parsed data displays beautifully
- [ ] No console errors in browser
- [ ] No errors in Docker logs
- [ ] Background worker is running
- [ ] Database migrations applied

---

## Success Criteria

✅ **MVP is complete when:**
- User can upload resume → see parsed structured data
- User can input job URL → see parsed attributes
- Background processing works reliably
- UI displays parsed data clearly
- Error handling is comprehensive
- Tested with real-world resumes and job postings
- Ready to demo to users for feedback

**Status:** Ready for Testing! 🚀
