# frozen_string_literal: true

module LLM
  class JobDescriptionParser
    def initialize(client: OpenAIClient.new)
      @client = client
    end

    def parse(text)
      # Parse with OpenAI using schema and prompt
      response = @client.chat(
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: Schemas::JobDescriptionSchema.system_prompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'job_description_extraction',
            schema: Schemas::JobDescriptionSchema.json_schema,
            strict: true
          }
        }
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
        model: 'gpt-4o-mini'
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_job_description',
        model: 'gpt-4o-mini'
      )
      raise
    end
  end
end
