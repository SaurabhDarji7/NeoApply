# frozen_string_literal: true

module LLM
  class BaseParser
    def initialize(client: OpenAIClient.new)
      @client = client
    end

    def parse(text)
      safe_text = Config.validate_input_length(text)

      response = @client.chat(
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

      validation_result = validate(parsed_data)

      unless validation_result[:valid]
        error = StandardError.new("#{operation_name.capitalize} validation failed: #{validation_result[:errors].join('; ')}")
        LLMServiceErrorReporting.report_validation_error(
          error,
          parsed_data: parsed_data,
          validation_errors: validation_result[:errors],
          operation: operation_name
        )
        raise error
      end

      parsed_data
    rescue JSON::ParserError => e
      LLMServiceErrorReporting.report_parsing_error(
        e,
        operation: operation_name,
        raw_response: response
      )
      raise StandardError, "Invalid JSON response from LLM: #{e.message}"
    rescue OpenAI::Error => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: operation_name,
        model: Config.model_for(:parsing)
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: operation_name,
        model: Config.model_for(:parsing)
      )
      raise
    end

    private

    def schema_class
      raise NotImplementedError, "#{self.class} must implement #schema_class"
    end

    def schema_name
      raise NotImplementedError, "#{self.class} must implement #schema_name"
    end

    def operation_name
      raise NotImplementedError, "#{self.class} must implement #operation_name"
    end

    def validate(parsed_data)
      raise NotImplementedError, "#{self.class} must implement #validate"
    end
  end
end
