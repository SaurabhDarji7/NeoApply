class AutofillProfile < ApplicationRecord
  belongs_to :user

  # Validations for onboarding (all required fields)
  validates :first_name, :last_name, :email, presence: true
  validates :phone, :country, :city, :state, presence: true, on: :onboarding

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
