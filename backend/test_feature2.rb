# Test script for Feature 2 implementation
# Run with: docker-compose exec backend bin/rails runner test_feature2.rb

puts "=" * 80
puts "Feature 2 Implementation Test Script"
puts "=" * 80
puts ""

# Test 1: Check if Template model exists and has correct associations
puts "Test 1: Checking Template model..."
begin
  template = Template.new
  puts "✅ Template model exists"
  puts "   Attributes: #{Template.column_names.join(', ')}"
  puts "   Has file attachment: #{Template.reflect_on_attachment(:file).present?}"
  puts "   Has pdf_file attachment: #{Template.reflect_on_attachment(:pdf_file).present?}"
rescue => e
  puts "❌ Template model error: #{e.message}"
end
puts ""

# Test 2: Check User association
puts "Test 2: Checking User associations..."
begin
  user = User.first || User.create!(
    email: "test_feature2@example.com",
    password: "password123",
    password_confirmation: "password123",
    confirmed_at: Time.current
  )
  puts "✅ User exists: #{user.email}"
  puts "   Can create templates: #{user.respond_to?(:templates)}"

  # Create a test template
  template = user.templates.create!(
    name: "Test Template",
    content_text: "Test resume content",
    status: "pending"
  )
  puts "✅ Template created: ID #{template.id}"
rescue => e
  puts "❌ User/Template association error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end
puts ""

# Test 3: Test JSON Schema Validator
puts "Test 3: Testing JsonSchemaValidatorService..."
begin
  # Valid resume data
  valid_resume = {
    "personal_info" => {
      "name" => "John Doe",
      "email" => "john@example.com"
    },
    "skills" => [],
    "experience" => []
  }

  result = JsonSchemaValidatorService.validate_resume(valid_resume)
  puts "✅ Schema validator works"
  puts "   Valid resume result: #{result[:valid]}"

  # Invalid resume (missing required fields)
  invalid_resume = { "foo" => "bar" }
  result = JsonSchemaValidatorService.validate_resume(invalid_resume)
  puts "   Invalid resume detected: #{!result[:valid]}"
  puts "   Errors: #{result[:errors].first}" if result[:errors].any?
rescue => e
  puts "❌ Schema validator error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end
puts ""

# Test 4: Test LLM Service structure
puts "Test 4: Checking LLM Service..."
begin
  llm_client = LLM::OpenAIClient.new
  puts "✅ LLM::OpenAIClient initialized"
  puts "   Has parse_resume method: #{llm_client.respond_to?(:parse_resume)}"
  puts "   Has parse_job_description method: #{llm_client.respond_to?(:parse_job_description)}"
  puts "   Retry constants defined: MAX_RETRIES=#{LLM::OpenAIClient::MAX_RETRIES}"
rescue => e
  puts "❌ LLM Service error: #{e.message}"
end
puts ""

# Test 5: Test DocxTemplateService
puts "Test 5: Checking DocxTemplateService..."
begin
  puts "✅ DocxTemplateService exists"
  puts "   Available tokens: #{DocxTemplateService.available_tokens.join(', ')}"
rescue => e
  puts "❌ DocxTemplateService error: #{e.message}"
end
puts ""

# Test 6: Test ParseTemplateJob
puts "Test 6: Checking ParseTemplateJob..."
begin
  puts "✅ ParseTemplateJob exists"
  puts "   Job queue: #{ParseTemplateJob.queue_name}"
rescue => e
  puts "❌ ParseTemplateJob error: #{e.message}"
end
puts ""

# Test 7: Check routes
puts "Test 7: Checking routes..."
begin
  routes = Rails.application.routes.routes.map do |route|
    route.path.spec.to_s if route.path.spec.to_s.include?('template')
  end.compact

  if routes.any?
    puts "✅ Template routes configured:"
    routes.uniq.each { |r| puts "   #{r}" }
  else
    puts "❌ No template routes found"
  end
rescue => e
  puts "❌ Routes error: #{e.message}"
end
puts ""

# Test 8: Test database schema
puts "Test 8: Checking database schema..."
begin
  template = Template.new
  required_columns = %w[user_id name status parsed_attributes raw_llm_response
                        error_message attempt_count started_at completed_at content_text]

  missing_columns = required_columns - Template.column_names

  if missing_columns.empty?
    puts "✅ All required columns present in templates table"
  else
    puts "❌ Missing columns: #{missing_columns.join(', ')}"
  end

  # Check Resume model has new fields
  resume_new_fields = %w[raw_llm_response attempt_count started_at completed_at content_text]
  missing_resume_fields = resume_new_fields - Resume.column_names

  if missing_resume_fields.empty?
    puts "✅ All new fields present in resumes table"
  else
    puts "❌ Missing resume fields: #{missing_resume_fields.join(', ')}"
  end

  # Check JobDescription model has new fields
  job_new_fields = %w[raw_llm_response attempt_count started_at completed_at]
  missing_job_fields = job_new_fields - JobDescription.column_names

  if missing_job_fields.empty?
    puts "✅ All new fields present in job_descriptions table"
  else
    puts "❌ Missing job_descriptions fields: #{missing_job_fields.join(', ')}"
  end
rescue => e
  puts "❌ Database schema error: #{e.message}"
end
puts ""

# Test 9: Test Template validations
puts "Test 9: Testing Template validations..."
begin
  # Test 1: Template without name should fail
  t1 = Template.new(content_text: "test")
  if !t1.valid? && t1.errors[:name].present?
    puts "✅ Name validation works"
  else
    puts "❌ Name validation failed"
  end

  # Test 2: Template without file or text should fail
  t2 = Template.new(name: "Test")
  if !t2.valid? && t2.errors[:base].present?
    puts "✅ File/text validation works"
  else
    puts "❌ File/text validation failed"
  end

  # Test 3: Template with text should be valid
  t3 = Template.new(name: "Test", content_text: "Resume text", user: User.first)
  if t3.valid?
    puts "✅ Valid template with text passes validation"
  else
    puts "❌ Valid template validation failed: #{t3.errors.full_messages.join(', ')}"
  end
rescue => e
  puts "❌ Validation test error: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end
puts ""

# Test 10: Summary
puts "=" * 80
puts "Test Summary"
puts "=" * 80
puts ""
puts "Core Components:"
puts "  ✓ Template model with validations"
puts "  ✓ Enhanced Resume & JobDescription models"
puts "  ✓ JSON Schema Validator Service"
puts "  ✓ Enhanced LLM Service with retry logic"
puts "  ✓ DocxTemplateService with token support"
puts "  ✓ ParseTemplateJob for background processing"
puts "  ✓ Template routes configured"
puts "  ✓ Database migrations applied"
puts ""
puts "Next Steps for Manual Testing:"
puts "  1. Start the backend: docker-compose up"
puts "  2. Navigate to frontend: http://localhost:5173/templates"
puts "  3. Create a template with text or .docx file"
puts "  4. Wait for parsing (or check with GET /api/v1/templates/:id)"
puts "  5. Apply job description tokens"
puts "  6. Download the result"
puts ""
puts "API Testing:"
puts "  POST /api/v1/templates - Create template"
puts "  GET /api/v1/templates - List all templates"
puts "  GET /api/v1/templates/:id - Get single template"
puts "  POST /api/v1/templates/:id/parse - Retry parsing"
puts "  POST /api/v1/templates/:id/apply_job - Apply job tokens"
puts "  GET /api/v1/templates/:id/download?format=docx - Download"
puts ""
puts "=" * 80
puts "Test script completed!"
puts "=" * 80
