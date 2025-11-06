# frozen_string_literal: true

# Service adapter that provides a singleton interface to LLM parsing operations
class LLMService
  def self.parse_resume(text)
    resume_parser.parse(text)
  end

  def self.parse_job_description(text)
    job_description_parser.parse(text)
  end

  private

  def self.resume_parser
    @resume_parser ||= LLM::ResumeParser.new
  end

  def self.job_description_parser
    @job_description_parser ||= LLM::JobDescriptionParser.new
  end
end
