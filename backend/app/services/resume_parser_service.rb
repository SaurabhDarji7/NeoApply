# frozen_string_literal: true

class ResumeParserService
  def initialize(resume)
    @resume = resume
  end

  def parse
    @resume.update!(status: 'processing')

    # Extract text
    Rails.logger.info "=== EXTRACTING TEXT FROM RESUME #{@resume.id} ==="
    text = extract_text
    Rails.logger.info "Text extracted, length: #{text.length}, encoding: #{text.encoding.name}"
    Rails.logger.info "Text valid UTF-8?: #{text.valid_encoding?}"
    Rails.logger.info "First 100 chars: #{text[0..100].inspect}"

    # Parse with LLM
    Rails.logger.info "=== SENDING TO LLM ==="
    result = ::LLMService.parse_resume(text)
    Rails.logger.info "=== LLM PARSING COMPLETED ==="

    # Extract the parsed data from the result wrapper
    parsed_data = result[:parsed_data]

    # Validate structure
    validate_parsed_data(parsed_data)

    # Save to database with raw response
    @resume.update!(
      status: 'completed',
      parsed_data: parsed_data,
      raw_llm_response: result[:raw_response]
    )

    parsed_data
  rescue => e
    Rails.logger.error "=== RESUME PARSING FAILED ==="
    Rails.logger.error "Error class: #{e.class}"
    Rails.logger.error "Error message: #{e.message}"
    Rails.logger.error "Backtrace:"
    Rails.logger.error e.backtrace.join("\n")
    @resume.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end

  private

  def extract_text
    # Use content_text if no file is attached
    if @resume.file.attached?
      FileProcessorService.extract_text(@resume.file.blob)
    else
      @resume.content_text || ''
    end
  end

  def validate_parsed_data(data)
    required_keys = ['personal_info', 'skills', 'experience', 'education']
    missing_keys = required_keys - data.keys

    if missing_keys.any?
      raise "Invalid parsed data: missing keys #{missing_keys.join(', ')}"
    end
  end
end
