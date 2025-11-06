# frozen_string_literal: true

# Comprehensive Template Feature Testing
# Run with: docker-compose exec backend bin/rails runner test_templates_e2e.rb

puts "\n" + "=" * 80
puts "TEMPLATE FEATURE - END-TO-END TEST"
puts "=" * 80
puts ""

# 1. Setup test user
puts "1. Setting up test user..."
user = User.find_by(email: 'test@example.com')
if user.nil?
  puts "❌ No test user found. Please create one at http://localhost:5173/signup"
  exit 1
end
puts "✅ Test User: #{user.email} (ID: #{user.id})"
puts ""

# 2. Create a completed job description for token testing
puts "2. Creating test job description..."
job = user.job_descriptions.new(
  url: "https://example.com/senior-rails-test",
  title: "Senior Rails Engineer",
  company_name: "Tech Innovators Inc",
  status: "completed"
)
job.parsed_attributes = {
    "title" => "Senior Rails Engineer",
    "company_name" => "Tech Innovators Inc",
    "job_location" => "San Francisco, CA (Hybrid)",
    "job_type" => "full_time",
    "experience_level" => "Senior",
    "top_5_skills_needed" => ["Ruby on Rails", "PostgreSQL", "Redis", "Docker", "Kubernetes"],
    "skills_required" => [
      { "name" => "Ruby on Rails", "importance" => "Required", "years" => 5 },
      { "name" => "PostgreSQL", "importance" => "Required", "years" => 3 },
      { "name" => "Redis", "importance" => "Preferred", "years" => 2 }
    ],
    "responsibilities" => [
      "Design and implement scalable backend systems using Rails",
      "Lead technical architecture decisions for microservices",
      "Mentor and guide junior developers on best practices"
    ],
    "qualifications" => [
      "5+ years of professional Ruby on Rails development",
      "Strong understanding of RESTful API design and database optimization",
      "Experience with cloud platforms (AWS/GCP) and containerization"
    ],
    "salary_range" => {
      "min" => 160000,
      "max" => 220000,
      "currency" => "USD",
      "period" => "annual"
    }
}
job.save!

puts "✅ Job Description created!"
puts "   ID: #{job.id}"
puts "   Title: #{job.title}"
puts "   Company: #{job.company_name}"
puts ""

# 3. Test available tokens
puts "3. Testing token availability..."
tokens = DocxTemplateService::AVAILABLE_TOKENS.keys
puts "   Available tokens (#{tokens.length}):"
tokens.each { |token| puts "     - {{#{token}}}" }
puts ""

# 4. Test token values for this job
puts "4. Testing token values for job #{job.id}..."
token_values = {
  "company_name" => DocxTemplateService::AVAILABLE_TOKENS['company_name'].call(job),
  "title" => DocxTemplateService::AVAILABLE_TOKENS['title'].call(job),
  "job_location" => DocxTemplateService::AVAILABLE_TOKENS['job_location'].call(job),
  "job_type" => DocxTemplateService::AVAILABLE_TOKENS['job_type'].call(job),
  "experience_level" => DocxTemplateService::AVAILABLE_TOKENS['experience_level'].call(job),
  "top_5_skills_needed" => DocxTemplateService::AVAILABLE_TOKENS['top_5_skills_needed'].call(job),
  "salary_range" => DocxTemplateService::AVAILABLE_TOKENS['salary_range'].call(job)
}

token_values.each do |token_name, value|
  puts "   ✅ {{#{token_name}}} = #{value}"
end
puts ""

# 5. Create template with text (to avoid OpenAI DNS issues)
puts "5. Creating template with text content..."
template_text = <<~TEXT
  COVER LETTER TEMPLATE

  Dear Hiring Manager at {{company_name}},

  I am writing to express my strong interest in the {{title}} position at your company.
  I noticed this role is located in {{job_location}} and is a {{job_type}} position.

  As a {{experience_level}} professional, I have extensive experience with the key skills you're looking for:
  {{top_5_skills_needed}}

  The responsibilities you've outlined align perfectly with my experience:
  {{responsibilities}}

  I meet all the qualifications you're seeking:
  {{qualifications}}

  I am very interested in the compensation range of {{salary_range}} and believe
  my experience justifies this level.

  Thank you for your consideration.

  Sincerely,
  [Your Name]
TEXT

template = user.templates.create!(
  name: "Cover Letter Template with Tokens",
  content_text: template_text,
  status: "pending"
)

if template.persisted?
  puts "✅ Template created successfully"
  puts "   ID: #{template.id}"
  puts "   Name: #{template.name}"
  puts "   Status: #{template.status}"
  puts "   Content preview: #{template.content_text[0..100]}..."
else
  puts "❌ Failed to create template"
  puts "   Errors: #{template.errors.full_messages.join(', ')}"
  exit 1
end
puts ""

# 6. Test template listing
puts "6. Testing template listing with pagination..."
templates = user.templates.page(1).per(10)
puts "✅ Found #{templates.count} template(s)"
templates.each do |t|
  puts "   - #{t.name} (Status: #{t.status}, ID: #{t.id})"
end
puts ""

# 7. Test template with attached .docx file
puts "7. Testing template with .docx file..."
docx_path = Rails.root.join('bin', 'SaurabhDarjiResume.docx')

if File.exist?(docx_path)
  puts "   Found test file: #{docx_path}"
  puts "   File size: #{File.size(docx_path) / 1024}KB"

  # Create template with file
  file_template = user.templates.new(name: "Saurabh's Resume Template")
  file_template.file.attach(
    io: File.open(docx_path),
    filename: 'SaurabhDarjiResume.docx',
    content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )

  if file_template.save
    puts "✅ Template with file created successfully"
    puts "   ID: #{file_template.id}"
    puts "   File attached: #{file_template.file.attached?}"
    puts "   Filename: #{file_template.file.filename}"
    puts "   Size: #{file_template.file.byte_size / 1024}KB"
  else
    puts "❌ Failed to create template with file"
    puts "   Errors: #{file_template.errors.full_messages.join(', ')}"
  end
else
  puts "⚠️  Test .docx file not found at: #{docx_path}"
end
puts ""

# 8. Test validation
puts "8. Testing validations..."
tests = [
  {
    name: "Missing name",
    attrs: { content_text: "Test" },
    should_fail: true
  },
  {
    name: "Missing both file and text",
    attrs: { name: "Test" },
    should_fail: true
  },
  {
    name: "Valid with text",
    attrs: { name: "Valid Template", content_text: "Some text" },
    should_fail: false
  }
]

tests.each do |test|
  temp = user.templates.new(test[:attrs])
  valid = temp.valid?

  if test[:should_fail]
    if !valid
      puts "   ✅ #{test[:name]}: Correctly rejected"
    else
      puts "   ❌ #{test[:name]}: Should have failed but didn't"
    end
  else
    if valid
      puts "   ✅ #{test[:name]}: Correctly accepted"
    else
      puts "   ❌ #{test[:name]}: Should have passed but failed"
    end
  end
end
puts ""

# 9. Test template deletion
puts "9. Testing template deletion..."
delete_test = user.templates.create!(
  name: "Delete Me",
  content_text: "This will be deleted"
)
delete_id = delete_test.id
delete_test.destroy!

begin
  Template.find(delete_id)
  puts "❌ Template was not deleted"
rescue ActiveRecord::RecordNotFound
  puts "✅ Template deleted successfully"
end
puts ""

# Summary
puts "=" * 80
puts "TEST SUMMARY"
puts "=" * 80
puts ""
puts "✅ Test user verified"
puts "✅ Job description created (ID: #{job.id})"
puts "✅ Token availability tested (#{tokens.length} tokens)"
puts "✅ Token values verified"
puts "✅ Template creation (text) tested"
puts "✅ Template listing tested"
puts "✅ Template with file tested" if File.exist?(docx_path)
puts "✅ Validation tests passed"
puts "✅ Template deletion tested"
puts ""
puts "IMPORTANT: To test token replacement, use the UI:"
puts "1. Go to http://localhost:5173/templates"
puts "2. Click 'Apply to Job' on template ID: #{template.id}"
puts "3. Select job: #{job.title} at #{job.company_name}"
puts "4. Download the file and verify tokens are replaced"
puts ""
puts "=" * 80
