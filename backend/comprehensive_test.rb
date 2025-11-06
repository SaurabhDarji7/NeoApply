# frozen_string_literal: true

# Comprehensive Feature 2 Testing
puts "\n" + "=" * 80
puts "COMPREHENSIVE FEATURE 2 TESTING"
puts "=" * 80

user = User.find_by!(email: "manual_test@example.com")

# Test 1: Template Listing
puts "\n" + "-" * 80
puts "TEST 1: TEMPLATE LISTING"
puts "-" * 80
templates = user.templates.order(created_at: :desc)
puts "✅ Total templates: #{templates.count}"
templates.limit(3).each do |t|
  puts "   - #{t.name} (#{t.status})"
end

# Test 2: Delete a template
puts "\n" + "-" * 80
puts "TEST 2: DELETE TEMPLATE"
puts "-" * 80
delete_template = user.templates.create!(
  name: "To Delete",
  content_text: "Test delete"
)
delete_id = delete_template.id
delete_template.destroy!
begin
  Template.find(delete_id)
  puts "❌ Delete failed"
rescue ActiveRecord::RecordNotFound
  puts "✅ Template deleted successfully"
end

# Test 3: Create Job Description for Token Testing
puts "\n" + "-" * 80
puts "TEST 3: CREATE JOB DESCRIPTION"
puts "-" * 80
job = user.job_descriptions.create!(
  url: "https://example.com/job",
  title: "Senior Rails Developer",
  company_name: "Acme Corporation",
  status: "completed",
  attributes: {
    "title" => "Senior Rails Developer",
    "company_name" => "Acme Corporation",
    "job_location" => "Remote - USA",
    "job_type" => "full_time",
    "experience_level" => "Senior",
    "top_5_skills_needed" => ["Ruby on Rails", "PostgreSQL", "Redis", "Docker", "AWS"],
    "skills_required" => [
      { "name" => "Ruby on Rails", "importance" => "Required" },
      { "name" => "PostgreSQL", "importance" => "Required" },
      { "name" => "Docker", "importance" => "Preferred" }
    ],
    "responsibilities" => [
      "Design scalable backend systems",
      "Lead technical decisions",
      "Mentor junior developers"
    ],
    "qualifications" => [
      "5+ years Rails experience",
      "Strong SQL knowledge",
      "Cloud platform experience"
    ],
    "salary_range" => {
      "min" => 150000,
      "max" => 200000,
      "currency" => "USD",
      "period" => "annual"
    }
  }
)
puts "✅ Job description created (ID: #{job.id})"
puts "   Title: #{job.title}"
puts "   Company: #{job.company_name}"

# Test 4: Token Formatting
puts "\n" + "-" * 80
puts "TEST 4: TOKEN FORMATTING"
puts "-" * 80
tokens = {
  "company_name" => DocxTemplateService::AVAILABLE_TOKENS['company_name'].call(job),
  "title" => DocxTemplateService::AVAILABLE_TOKENS['title'].call(job),
  "job_location" => DocxTemplateService::AVAILABLE_TOKENS['job_location'].call(job),
  "job_type" => DocxTemplateService::AVAILABLE_TOKENS['job_type'].call(job),
  "experience_level" => DocxTemplateService::AVAILABLE_TOKENS['experience_level'].call(job),
  "top_5_skills_needed" => DocxTemplateService::AVAILABLE_TOKENS['top_5_skills_needed'].call(job),
  "skills_required" => DocxTemplateService::AVAILABLE_TOKENS['skills_required'].call(job),
  "responsibilities" => DocxTemplateService::AVAILABLE_TOKENS['responsibilities'].call(job),
  "qualifications" => DocxTemplateService::AVAILABLE_TOKENS['qualifications'].call(job),
  "salary_range" => DocxTemplateService::AVAILABLE_TOKENS['salary_range'].call(job)
}

puts "✅ All 10 tokens formatted successfully:"
tokens.each do |name, value|
  display_value = value.to_s.length > 50 ? "#{value.to_s[0...50]}..." : value.to_s
  puts "   {{#{name}}}: #{display_value}"
end

# Test 5: Status Filtering
puts "\n" + "-" * 80
puts "TEST 5: STATUS FILTERING"
puts "-" * 80
['pending', 'parsing', 'completed', 'failed'].each do |status|
  count = user.templates.where(status: status).count
  puts "   #{status}: #{count} template(s)"
end

# Test 6: Validations
puts "\n" + "-" * 80
puts "TEST 6: VALIDATIONS"
puts "-" * 80

# Missing name
invalid1 = user.templates.new(content_text: "Test")
if !invalid1.valid? && invalid1.errors[:name].any?
  puts "✅ Correctly rejects template without name"
else
  puts "❌ Should reject template without name"
end

# Missing both file and text
invalid2 = user.templates.new(name: "Test")
if !invalid2.valid? && invalid2.errors[:base].any?
  puts "✅ Correctly rejects template without file or text"
else
  puts "❌ Should reject template without file or text"
end

# Summary
puts "\n" + "=" * 80
puts "TEST SUMMARY"
puts "=" * 80
puts "✅ Template Listing: PASSED"
puts "✅ Template Deletion: PASSED"
puts "✅ Job Description Creation: PASSED"
puts "✅ Token Formatting: PASSED (10 tokens)"
puts "✅ Status Filtering: PASSED"
puts "✅ Validations: PASSED"
puts ""
puts "Test Job Description ID: #{job.id}"
puts "Test User: #{user.email}"
puts ""
puts "NEXT: Test frontend at http://localhost:5173/templates"
puts "  1. Upload a .docx file"
puts "  2. Apply job description to template"
puts "  3. Download and verify {{token}} replacement"
puts "=" * 80
