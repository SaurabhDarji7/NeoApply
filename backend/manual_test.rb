# frozen_string_literal: true

# Manual Step-by-Step Testing
puts "\n" + "=" * 80
puts "MANUAL TESTING - Feature 2"
puts "=" * 80

# Step 1: Clean up and setup
puts "\n1. Cleaning up old test data..."
Template.where(status: ["failed", "parsing"]).destroy_all
puts "✅ Cleaned up old templates"

# Step 2: Create/find test user
puts "\n2. Setting up test user..."
user = User.find_or_create_by!(email: "manual_test@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.confirmed_at = Time.current
end
puts "✅ User: #{user.email} (ID: #{user.id})"

# Step 3: Create template with text input
puts "\n3. Creating template with text input..."
template = user.templates.create!(
  name: "Test Resume - #{Time.current.to_i}",
  content_text: <<~TEXT
    John Doe
    Senior Software Engineer
    john@email.com | 555-1234 | San Francisco, CA

    EXPERIENCE
    Senior Engineer at TechCorp (2020-Present)
    - Led backend development
    - Improved performance by 40%

    EDUCATION
    BS Computer Science, MIT, 2018
  TEXT
)
puts "✅ Template created (ID: #{template.id})"
puts "   Status: #{template.status}"

# Step 4: Wait and check parsing
puts "\n4. Checking parsing status (will check for 45 seconds)..."
45.times do |i|
  sleep 1
  template.reload
  print "."

  if template.status == "completed"
    puts "\n✅ PARSING COMPLETED!"
    puts "   Attempts: #{template.attempt_count}"
    puts "   Has parsed_attributes: #{template.parsed_attributes.present?}"
    break
  elsif template.status == "failed"
    puts "\n❌ PARSING FAILED!"
    puts "   Error: #{template.error_message}"
    break
  elsif i == 44
    puts "\n⚠️  Still #{template.status} after 45 seconds"
  end
end

puts "\n" + "=" * 80
puts "Current Template ID: #{template.id}"
puts "Current Status: #{template.reload.status}"
puts "=" * 80
