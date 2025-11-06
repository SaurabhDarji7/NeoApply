# frozen_string_literal: true

class LLMService
  def self.parse_resume(text)
    LLM::Parser.parse(
      text,
      schema_class: LLM::Schemas::ResumeSchema,
      schema_name: 'resume_extraction',
      operation: 'parse_resume',
      validator: ->(data) { JsonSchemaValidatorService.validate_resume(data) }
    )
  end

  def self.parse_job_description(text)
    LLM::Parser.parse(
      text,
      schema_class: LLM::Schemas::JobDescriptionSchema,
      schema_name: 'job_description_extraction',
      operation: 'parse_job_description',
      validator: ->(data) { JsonSchemaValidatorService.validate_job_description(data) }
    )
  end
end
