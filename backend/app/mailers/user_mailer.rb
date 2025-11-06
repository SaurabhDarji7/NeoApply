# frozen_string_literal: true

class UserMailer < ApplicationMailer
  # Send OTP verification email
  # @param user [User] The user receiving the email
  # @param otp [String] The one-time password
  def verify_email(user, otp)
    @user = user
    @otp = otp
    frontend = ENV.fetch('FRONTEND_URL', 'http://localhost:5173')
    # Include code in the URL so users can click and verify easily (dev-friendly)
    @verification_url = "#{frontend}/verify-email?email=#{CGI.escape(user.email)}&code=#{CGI.escape(@otp)}"

    mail(
      to: user.email,
      subject: 'Verify your NeoApply account'
    )
  end
end
