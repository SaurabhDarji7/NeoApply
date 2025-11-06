# frozen_string_literal: true

class ParseResumeJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(resume_id)
    resume = Resume.find(resume_id)
    ResumeParserService.new(resume).parse
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("Resume not found: #{resume_id}")
    raise
  end
end
