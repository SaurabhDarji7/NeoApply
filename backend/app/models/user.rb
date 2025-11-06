class User < ApplicationRecord
  # Include default devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :resumes, dependent: :destroy
  has_many :job_descriptions, dependent: :destroy
  has_many :templates, dependent: :destroy
  has_one :autofill_profile, dependent: :destroy
  has_many :applications, dependent: :destroy

  # Callbacks
  after_create :create_default_autofill_profile

  # Validations
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  # OTP Configuration
  OTP_EXPIRY = 15.minutes
  OTP_LENGTH = 6

  # Generate and store a new OTP
  # @return [String] The generated OTP (plain text)
  def generate_otp!
    otp = SecureRandom.random_number(10**OTP_LENGTH).to_s.rjust(OTP_LENGTH, '0')
    self.otp_digest = BCrypt::Password.create(otp)
    self.otp_sent_at = Time.current
    save!
    otp
  end

  # Validate an OTP against the stored digest
  # @param otp [String] The OTP to validate
  # @return [Boolean] True if OTP is valid and not expired
  def valid_otp?(otp)
    return false if otp_digest.blank? || otp_sent_at.blank?
    return false if otp_sent_at < OTP_EXPIRY.ago

    BCrypt::Password.new(otp_digest) == otp
  rescue BCrypt::Errors::InvalidHash
    false
  end

  # Clear OTP fields after successful verification
  def clear_otp!
    update!(otp_digest: nil, otp_sent_at: nil)
  end

  # Check if user's email is confirmed
  def email_confirmed?
    confirmed_at.present?
  end

  # Confirm user's email
  def confirm_email!
    update!(confirmed_at: Time.current)
    clear_otp!
  end

  private

  # Create default autofill profile when user signs up
  def create_default_autofill_profile
    build_autofill_profile(
      first_name: '',
      last_name: '',
      email: email
    ).save(validate: false) # Skip validation on creation since required fields are empty
  end
end
