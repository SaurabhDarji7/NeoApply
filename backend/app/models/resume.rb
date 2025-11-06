class Resume < ApplicationRecord
  belongs_to :user
  has_one_attached :file

  # Validations
  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending processing completed failed] }
  validate :file_or_content_text_present
  validates :file, content_type: {
    in: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    message: 'must be PDF, DOCX, or TXT'
  }, size: {
    less_than: 10.megabytes,
    message: 'must be less than 10 MB'
  }, if: -> { file.attached? }

  # Scopes
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks - use after_commit to ensure record is committed before job runs
  after_commit :enqueue_parsing, on: :create

  private

  def file_or_content_text_present
    if file.blank? && content_text.blank?
      errors.add(:base, 'Either file or content text must be present')
    end
  end

  def enqueue_parsing
    ParseResumeJob.perform_later(id)
  end

  public

  # Instance methods
  def file_info
    return nil unless file.attached?

    {
      filename: file.filename.to_s,
      size: file.byte_size,
      content_type: file.content_type,
      url: Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true)
    }
  end
end
