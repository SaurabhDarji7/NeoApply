# frozen_string_literal: true

module LLM
  class JobDescriptionParser
    def initialize(client: OpenAIClient.new)
      @client = client
    end

    def parse(text)
      safe_text = Config.validate_input_length(text)

      response = @client.chat(
        model: Config.model_for(:parsing),
        messages: [
          { role: 'system', content: Schemas::JobDescriptionSchema.system_prompt },
          { role: 'user', content: safe_text }
        ],
        temperature: Config.temperature_for(:parsing),
        response_format: Config.json_schema_format(
          name: 'job_description_extraction',
          schema: Schemas::JobDescriptionSchema.json_schema
        )
      )

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      # Validate the response against our schema as a safety check
      validation_result = JsonSchemaValidatorService.validate_job_description(parsed_data)

      unless validation_result[:valid]
        error = StandardError.new("Job description validation failed: #{validation_result[:errors].join('; ')}")
        LLMServiceErrorReporting.report_validation_error(
          error,
          parsed_data: parsed_data,
          validation_errors: validation_result[:errors],
          operation: 'parse_job_description'
        )
        raise error
      end

      parsed_data
    rescue JSON::ParserError => e
      LLMServiceErrorReporting.report_parsing_error(
        e,
        operation: 'parse_job_description',
        raw_response: response
      )
      raise StandardError, "Invalid JSON response from LLM: #{e.message}"
    rescue OpenAI::Error => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_job_description',
        model: Config.model_for(:parsing)
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_job_description',
        model: Config.model_for(:parsing)
      )
      raise
    end
  end
end
