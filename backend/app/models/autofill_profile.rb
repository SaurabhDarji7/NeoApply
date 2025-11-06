class AutofillProfile < ApplicationRecord
  belongs_to :user

  # All fields required for auto-fill functionality
  validates :first_name, :last_name, :email, :phone, presence: true
  validates :country, :city, :state, presence: true

  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :linkedin, :github, :portfolio, format: { with: URI::DEFAULT_PARSER.make_regexp(%w[http https]), message: 'must be a valid URL' }, allow_blank: true

  # Check if profile is complete for onboarding
  def onboarding_complete?
    first_name.present? &&
      last_name.present? &&
      phone.present? &&
      country.present? &&
      city.present? &&
      state.present?
  end
end
