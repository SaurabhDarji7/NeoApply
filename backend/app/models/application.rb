class Application < ApplicationRecord
  belongs_to :user
  belongs_to :resume, optional: true

  enum :ats_type, {
    greenhouse: 'greenhouse',
    lever: 'lever',
    workday: 'workday',
    adp: 'adp',
    unknown: 'unknown'
  }, default: :unknown, validate: true

  enum :status, {
    autofilled: 'autofilled',
    submitted: 'submitted',
    interviewing: 'interviewing',
    offered: 'offered',
    rejected: 'rejected',
    withdrawn: 'withdrawn'
  }, default: :autofilled, validate: true

  validates :company, :role, :url, presence: true
  validates :url, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: 'must be a valid URL' }

  scope :recent, -> { order(applied_at: :desc) }
  scope :by_ats, ->(ats) { where(ats_type: ats) }
  scope :by_status, ->(status) { where(status: status) }

  def formatted_applied_at
    applied_at&.strftime('%B %d, %Y') || 'N/A'
  end
end
