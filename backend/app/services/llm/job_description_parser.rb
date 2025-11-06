# frozen_string_literal: true

module LLM
  class JobDescriptionParser < BaseParser
    private

    def schema_class
      Schemas::JobDescriptionSchema
    end

    def schema_name
      'job_description_extraction'
    end

    def operation_name
      'parse_job_description'
    end

    def validate(parsed_data)
      JsonSchemaValidatorService.validate_job_description(parsed_data)
    end
  end
end

LLM::ParserRegistry.register(:job_description, LLM::JobDescriptionParser)
