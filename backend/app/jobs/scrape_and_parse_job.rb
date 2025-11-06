# frozen_string_literal: true

class ScrapeAndParseJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: :polynomially_longer, attempts: 3

  def perform(job_description_id)
    job_description = JobDescription.find(job_description_id)

    # Scrape if URL provided
    if job_description.url.present?
      job_description.update!(status: 'scraping')
      raw_text = WebScraperService.scrape(job_description.url)
      job_description.update!(raw_text: raw_text)
    end

    # Parse
    JobParserService.new(job_description).parse
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error("Job description not found: #{job_description_id}")
    raise
  end
end
