resume = Resume.find(9)
puts '=== RESUME FOUND ==='
puts "ID: #{resume.id}"
puts "Status: #{resume.status}"

resume.update!(status: 'pending', error_message: nil)
puts '=== STARTING PARSE ==='

begin
  ResumeParserService.new(resume).parse
  puts '=== SUCCESS ==='
rescue => e
  puts '=== FAILED ==='
  puts "Error: #{e.class} - #{e.message}"
  puts e.backtrace[0..20].join("\n")
end
