# frozen_string_literal: true

module LLM
  class Parser
    def self.parse(text, schema_class:, schema_name:, operation:, validator:, client: OpenAIClient.new)
      safe_text = Config.validate_input_length(text)

      response = client.chat(
        model: Config.model_for(:parsing),
        messages: [
          { role: 'system', content: schema_class.system_prompt },
          { role: 'user', content: safe_text }
        ],
        temperature: Config.temperature_for(:parsing),
        response_format: Config.json_schema_format(
          name: schema_name,
          schema: schema_class.json_schema
        )
      )

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      validation_result = validator.call(parsed_data)

      unless validation_result[:valid]
        error = StandardError.new("#{operation.capitalize} validation failed: #{validation_result[:errors].join('; ')}")
        LLMServiceErrorReporting.report_validation_error(
          error,
          parsed_data: parsed_data,
          validation_errors: validation_result[:errors],
          operation: operation
        )
        raise error
      end

      parsed_data
    rescue JSON::ParserError => e
      LLMServiceErrorReporting.report_parsing_error(
        e,
        operation: operation,
        raw_response: response
      )
      raise StandardError, "Invalid JSON response from LLM: #{e.message}"
    rescue OpenAI::Error => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: operation,
        model: Config.model_for(:parsing)
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: operation,
        model: Config.model_for(:parsing)
      )
      raise
    end
  end
end
