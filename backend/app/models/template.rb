class Template < ApplicationRecord
  belongs_to :user
  has_one_attached :file
  has_one_attached :pdf_file

  # Validations
  validates :name, presence: true
  validates :status, presence: true, inclusion: { in: %w[pending parsing completed failed] }
  validate :file_or_content_text_present
  validates :file, content_type: {
    in: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    message: 'must be DOCX format only'
  }, size: {
    less_than: 10.megabytes,
    message: 'must be less than 10 MB'
  }, if: -> { file.attached? }

  # Scopes
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :recent, -> { order(created_at: :desc) }

  # Callbacks
  after_commit :enqueue_parsing, on: :create

  private

  def file_or_content_text_present
    if file.blank? && content_text.blank?
      errors.add(:base, 'Either file or content text must be present')
    end
    if file.present? && content_text.present?
      errors.add(:base, 'Cannot have both file and content text')
    end
  end

  def enqueue_parsing
    ParseTemplateJob.perform_later(id)
  end

  public

  def file_info
    return nil unless file.attached?

    {
      filename: file.filename.to_s,
      size: file.byte_size,
      content_type: file.content_type,
      url: Rails.application.routes.url_helpers.rails_blob_path(file, only_path: true)
    }
  end

  def pdf_info
    return nil unless pdf_file.attached?

    {
      filename: pdf_file.filename.to_s,
      size: pdf_file.byte_size,
      content_type: pdf_file.content_type,
      url: Rails.application.routes.url_helpers.rails_blob_path(pdf_file, only_path: true)
    }
  end
end
