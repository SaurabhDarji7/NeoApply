# frozen_string_literal: true

class LLMService
  def self.parse_resume(text)
    parse(:resume, text)
  end

  def self.parse_job_description(text)
    parse(:job_description, text)
  end

  private

  def self.parse(type, text)
    parser = LLM::ParserRegistry.get(type)
    parser.parse(text)
  end
end
