# frozen_string_literal: true

module LLM
  class ResumeParser
    def initialize(client: OpenAIClient.new)
      @client = client
    end

    def parse(text)
      # Validate and truncate input if necessary
      safe_text = Config.validate_input_length(text)

      # Parse with OpenAI using schema and prompt
      response = @client.chat(
        model: Config.model_for(:parsing),
        messages: [
          { role: 'system', content: Schemas::ResumeSchema.system_prompt },
          { role: 'user', content: safe_text }
        ],
        temperature: Config.temperature_for(:parsing),
        response_format: Config.json_schema_format(
          name: 'resume_extraction',
          schema: Schemas::ResumeSchema.json_schema
        )
      )

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      # Validate the response against our schema as a safety check
      validation_result = JsonSchemaValidatorService.validate_resume(parsed_data)

      unless validation_result[:valid]
        error = StandardError.new("Resume validation failed: #{validation_result[:errors].join('; ')}")
        LLMServiceErrorReporting.report_validation_error(
          error,
          parsed_data: parsed_data,
          validation_errors: validation_result[:errors],
          operation: 'parse_resume'
        )
        raise error
      end

      parsed_data
    rescue JSON::ParserError => e
      LLMServiceErrorReporting.report_parsing_error(
        e,
        operation: 'parse_resume',
        raw_response: response
      )
      raise StandardError, "Invalid JSON response from LLM: #{e.message}"
    rescue OpenAI::Error => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_resume',
        model: Config.model_for(:parsing)
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_resume',
        model: Config.model_for(:parsing)
      )
      raise
    end
  end
end
