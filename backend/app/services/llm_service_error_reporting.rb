# frozen_string_literal: true

class LLMServiceErrorReporting
  # Report LLM service errors to Honeybadger with context and fingerprinting
  def self.report(error, context = {}, fingerprint: nil)
    # Add default context for LLM errors
    full_context = {
      service: 'LLM',
      timestamp: Time.current,
      environment: Rails.env
    }.merge(context)

    # Build Honeybadger options
    honeybadger_options = { context: full_context }
    honeybadger_options[:fingerprint] = fingerprint if fingerprint

    # Report to Honeybadger
    Honeybadger.notify(error, honeybadger_options)

    # Also log locally for debugging
    Rails.logger.error("LLM Service Error: #{error.class} - #{error.message}")
    Rails.logger.error("Context: #{full_context.inspect}")
    Rails.logger.error("Fingerprint: #{fingerprint}") if fingerprint
    Rails.logger.error(error.backtrace.join("\n")) if error.backtrace
  end

  # Report validation errors specifically
  # Fingerprint: Groups by operation + validation error type, but keeps different validation failures separate
  def self.report_validation_error(error, parsed_data:, validation_errors:, operation:)
    # Create fingerprint based on operation and first validation error pattern
    # This groups similar validation failures together while separating different types
    fingerprint = generate_validation_fingerprint(operation, validation_errors)

    report(error, {
      error_type: 'validation_failure',
      operation: operation,
      validation_errors: validation_errors,
      parsed_data: parsed_data
    }, fingerprint: fingerprint)
  end

  # Report OpenAI API errors
  # Fingerprint: Groups by error class and operation
  def self.report_api_error(error, operation:, model:, attempt: nil)
    # Extract error code if available (e.g., 429, 500, timeout)
    error_code = extract_error_code(error)
    fingerprint = "llm_api_error_#{operation}_#{error_code || error.class.name}"

    report(error, {
      error_type: 'openai_api_error',
      operation: operation,
      model: model,
      attempt: attempt,
      error_class: error.class.name,
      error_code: error_code
    }, fingerprint: fingerprint)
  end

  # Report parsing errors (JSON, etc.)
  # Fingerprint: Groups by operation and parsing error type
  def self.report_parsing_error(error, operation:, raw_response:)
    fingerprint = "llm_parsing_error_#{operation}_#{error.class.name}"

    report(error, {
      error_type: 'response_parsing_error',
      operation: operation,
      raw_response: raw_response
    }, fingerprint: fingerprint)
  end

  private

  # Generate a fingerprint for validation errors
  # Groups by operation and error pattern (e.g., missing field, type mismatch)
  def self.generate_validation_fingerprint(operation, validation_errors)
    return "llm_validation_#{operation}_unknown" if validation_errors.blank?

    # Extract key error patterns to group similar errors
    error_pattern = validation_errors.first.to_s
                                          .gsub(/\d+/, 'N')  # Replace numbers with N
                                          .gsub(/'[^']+'/, 'VALUE')  # Replace quoted values
                                          .gsub(/"[^"]+"/, 'VALUE')  # Replace double quoted values
                                          .slice(0, 100)  # Limit length

    "llm_validation_#{operation}_#{Digest::MD5.hexdigest(error_pattern)[0..7]}"
  end

  # Extract error code from OpenAI error messages
  def self.extract_error_code(error)
    # Check for HTTP status codes in message
    if error.message =~ /(\d{3})/
      $1
    elsif error.is_a?(Faraday::TimeoutError)
      'timeout'
    elsif error.is_a?(Faraday::ConnectionFailed)
      'connection_failed'
    else
      nil
    end
  end
end
