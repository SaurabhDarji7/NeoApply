# frozen_string_literal: true

class LLMServiceErrorReporting
  def self.report(error, context = {}, fingerprint: nil)
    full_context = {
      service: 'LLM',
      timestamp: Time.current,
      environment: Rails.env
    }.merge(context)

    honeybadger_options = { context: full_context }
    honeybadger_options[:fingerprint] = fingerprint if fingerprint

    Honeybadger.notify(error, honeybadger_options)

    Rails.logger.error("LLM Service Error: #{error.class} - #{error.message}")
    Rails.logger.error("Context: #{full_context.inspect}")
    Rails.logger.error("Fingerprint: #{fingerprint}") if fingerprint
    Rails.logger.error(error.backtrace.join("\n")) if error.backtrace
  end

  def self.report_validation_error(error, parsed_data:, validation_errors:, operation:)
    fingerprint = generate_validation_fingerprint(operation, validation_errors)

    report(error, {
      error_type: 'validation_failure',
      operation: operation,
      validation_errors: validation_errors,
      parsed_data: parsed_data
    }, fingerprint: fingerprint)
  end

  def self.report_api_error(error, operation:, model:, attempt: nil)
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

  def self.report_parsing_error(error, operation:, raw_response:)
    fingerprint = "llm_parsing_error_#{operation}_#{error.class.name}"

    report(error, {
      error_type: 'response_parsing_error',
      operation: operation,
      raw_response: raw_response
    }, fingerprint: fingerprint)
  end

  private

  def self.generate_validation_fingerprint(operation, validation_errors)
    return "llm_validation_#{operation}_unknown" if validation_errors.blank?

    error_pattern = validation_errors.first.to_s
                                          .gsub(/\d+/, 'N')
                                          .gsub(/'[^']+'/, 'VALUE')
                                          .gsub(/"[^"]+"/, 'VALUE')
                                          .slice(0, 100)

    "llm_validation_#{operation}_#{Digest::MD5.hexdigest(error_pattern)[0..7]}"
  end

  def self.extract_error_code(error)
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
