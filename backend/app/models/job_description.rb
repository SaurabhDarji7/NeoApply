# frozen_string_literal: true

class JobDescription < ApplicationRecord
  belongs_to :user

  validates :status, inclusion: { in: %w[pending scraping parsing completed failed] }

  # Callbacks - use after_commit to ensure record is committed before job runs
  after_commit :enqueue_scraping, on: :create

  # Status workflow:
  # pending -> scraping (if URL provided) -> parsing -> completed
  # Any step can transition to 'failed'

  def completed?
    status == 'completed'
  end

  def failed?
    status == 'failed'
  end

  def processing?
    %w[scraping parsing].include?(status)
  end

  private

  def enqueue_scraping
    ScrapeAndParseJob.perform_later(id)
  end
end
