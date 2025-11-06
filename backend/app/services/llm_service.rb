# frozen_string_literal: true

class LLMService
  def self.parse_resume(text)
    client.parse_resume(text)
  end

  def self.parse_job_description(text)
    client.parse_job_description(text)
  end

  private

  def self.client
    @client ||= LLM::OpenAIClient.new
  end
end
