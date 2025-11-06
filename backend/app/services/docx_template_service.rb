# frozen_string_literal: true

require 'zip'
require 'tempfile'

class DocxTemplateService
  AVAILABLE_TOKENS = {
    # Job Description tokens
    'company_name' => ->(job) { job.parsed_attributes&.dig('company_name') },
    'title' => ->(job) { job.parsed_attributes&.dig('title') },
    'job_location' => ->(job) { job.parsed_attributes&.dig('job_location') || job.parsed_attributes&.dig('location') },
    'job_type' => ->(job) { job.parsed_attributes&.dig('job_type') },
    'experience_level' => ->(job) { job.parsed_attributes&.dig('experience_level') },
    'top_5_skills_needed' => ->(job) { format_array(job.parsed_attributes&.dig('top_5_skills_needed')) },
    'skills_required' => ->(job) { format_skills(job.parsed_attributes&.dig('skills_required')) },
    'responsibilities' => ->(job) { format_array(job.parsed_attributes&.dig('responsibilities')) },
    'qualifications' => ->(job) { format_array(job.parsed_attributes&.dig('qualifications')) },
    'salary_range' => ->(job) { format_salary(job.parsed_attributes&.dig('salary_range')) }
  }.freeze

  def initialize(template, job_description)
    @template = template
    @job_description = job_description
  end

  def apply_tokens(custom_mappings = {}, options = {})
    unless @template.file.attached?
      return { success: false, error: 'No file attached to template' }
    end

    @bold_tokens = options[:bold_tokens].nil? ? true : options[:bold_tokens]
    @highlight_skills = options[:highlight_skills] || false
    @skills_list = options[:skills_list] || []

    # Download the file to a temp location
    temp_input = Tempfile.new(['template_input', '.docx'])
    temp_output = Tempfile.new(['template_output', '.docx'])

    begin
      temp_input.binmode
      @template.file.download { |chunk| temp_input.write(chunk) }
      temp_input.rewind

      # Process the DOCX file
      replace_tokens_in_docx(temp_input.path, temp_output.path, custom_mappings)

      # Attach the new file to the template
      @template.file.attach(
        io: File.open(temp_output.path),
        filename: @template.file.filename.to_s,
        content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )

      { success: true }
    rescue StandardError => e
      Rails.logger.error("Token replacement failed: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      { success: false, error: e.message }
    ensure
      temp_input.close
      temp_input.unlink
      temp_output.close
      temp_output.unlink
    end
  end

  def self.available_tokens
    AVAILABLE_TOKENS.keys
  end

  private

  def replace_tokens_in_docx(input_path, output_path, custom_mappings)
    # DOCX files are ZIP archives containing XML files
    Zip::File.open(input_path) do |zip_file|
      Zip::OutputStream.open(output_path) do |output|
        zip_file.each do |entry|
          output.put_next_entry(entry.name)

          # Only process document.xml and other XML files that might contain text
          if entry.name.match?(/\.xml$/) && !entry.name.match?(/rels/)
            content = entry.get_input_stream.read

            # Replace tokens in the XML content
            content = replace_tokens_in_content(content, custom_mappings)

            # Post-process: Convert bold markers to proper Word XML
            content = apply_bold_formatting(content)

            output.write(content)
          else
            # Copy other files as-is (images, etc.)
            output.write(entry.get_input_stream.read)
          end
        end
      end
    end
  end

  def replace_tokens_in_content(content, custom_mappings)
    # Find all {{token}} patterns and replace them
    result = content.gsub(/\{\{(\w+)\}\}/) do |match|
      token_name = ::Regexp.last_match(1)

      # Get the replacement value
      replacement_value = nil
      if custom_mappings.key?(token_name)
        replacement_value = custom_mappings[token_name].to_s
      elsif AVAILABLE_TOKENS.key?(token_name)
        replacement_value = AVAILABLE_TOKENS[token_name].call(@job_description).to_s
      end

      if replacement_value
        sanitized = sanitize_xml(replacement_value)

        # If bold_tokens is enabled, wrap in Word XML bold tags
        if @bold_tokens
          # Wrap text in bold formatting using Word's XML structure
          wrap_in_bold(sanitized)
        else
          sanitized
        end
      else
        # Keep the token if we don't have a replacement
        match
      end
    end

    # Process skills highlighting if enabled
    if @highlight_skills && @skills_list.any?
      result = highlight_skills_in_zones(result)
    end

    result
  end

  def wrap_in_bold(text)
    # Word XML format for bold text within a run
    # We need to split the text into runs and apply bold formatting
    # Note: This assumes the token is within a <w:t> tag already
    # We'll mark it with a special pattern and process it in a second pass
    "__BOLD_START__#{text}__BOLD_END__"
  end

  def highlight_skills_in_zones(content)
    # Find all skill zones marked with <<SKILLS_START>> and <<SKILLS_END>>
    content.gsub(/&lt;&lt;SKILLS_START&gt;&gt;(.*?)&lt;&lt;SKILLS_END&gt;&gt;/m) do |match|
      zone_content = ::Regexp.last_match(1)

      # Highlight each skill word in this zone
      highlighted = zone_content
      @skills_list.each do |skill|
        # Match whole words only (case insensitive)
        # Escape special XML entities in skill name
        skill_escaped = sanitize_xml(skill)
        highlighted = highlighted.gsub(/\b#{Regexp.escape(skill_escaped)}\b/i) do |skill_match|
          wrap_in_bold(skill_match)
        end
      end

      highlighted
    end
  end

  def apply_bold_formatting(content)
    # Convert __BOLD_START__text__BOLD_END__ markers into proper Word XML
    # Word uses <w:r> (run) elements with <w:rPr> (run properties) for formatting
    content.gsub(/__BOLD_START__(.*?)__BOLD_END__/) do |match|
      bold_text = ::Regexp.last_match(1)

      # Check if we're already inside a <w:t> tag
      # If so, we need to close it, add bold run, and reopen it
      # For simplicity, we'll create a new run with bold formatting
      # The text is already XML-escaped at this point

      # Word XML structure for bold text:
      # </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>#{bold_text}</w:t></w:r><w:r><w:t>

      # However, this approach can be fragile. A more robust approach:
      # Just use Word's inline bold tags if we're in a text run
      # We'll use a simpler approach: close current text tag, add bold run, reopen

      "</w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t xml:space=\"preserve\">#{bold_text}</w:t></w:r><w:r><w:t xml:space=\"preserve\">"
    end
  end

  def sanitize_xml(text)
    # Escape XML special characters to prevent breaking the document
    text.gsub('&', '&amp;')
        .gsub('<', '&lt;')
        .gsub('>', '&gt;')
        .gsub('"', '&quot;')
        .gsub("'", '&apos;')
  end

  def self.format_array(arr)
    return '' if arr.nil? || arr.empty?

    arr.compact.join(', ')
  end

  def self.format_skills(skills)
    return '' if skills.nil? || skills.empty?

    skills.compact.map do |skill|
      if skill.is_a?(Hash)
        skill['name'] || skill[:name]
      else
        skill.to_s
      end
    end.compact.join(', ')
  end

  def self.format_salary(salary_range)
    return '' if salary_range.nil?

    if salary_range.is_a?(Hash)
      min = salary_range['min'] || salary_range[:min]
      max = salary_range['max'] || salary_range[:max]
      currency = salary_range['currency'] || salary_range[:currency] || 'USD'
      period = salary_range['period'] || salary_range[:period] || 'annual'

      return '' if min.nil? && max.nil?

      if min && max
        "#{currency} #{min}-#{max} (#{period})"
      elsif min
        "#{currency} #{min}+ (#{period})"
      elsif max
        "Up to #{currency} #{max} (#{period})"
      else
        ''
      end
    else
      salary_range.to_s
    end
  end
end
