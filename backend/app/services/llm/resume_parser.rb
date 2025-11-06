# frozen_string_literal: true

module LLM
  class ResumeParser < BaseParser
    private

    def schema_class
      Schemas::ResumeSchema
    end

    def schema_name
      'resume_extraction'
    end

    def operation_name
      'parse_resume'
    end

    def validate(parsed_data)
      JsonSchemaValidatorService.validate_resume(parsed_data)
    end
  end
end

LLM::ParserRegistry.register(:resume, LLM::ResumeParser)
