# frozen_string_literal: true

require 'bcrypt'

email = ENV.fetch('EMAIL') { abort('EMAIL env var required') }

user = User.where('lower(email) = ?', email.downcase).first or abort("User not found: #{email}")

otp = user.generate_otp!
UserMailer.verify_email(user, otp).deliver_now

puts "Sent verification email to #{user.email} with OTP #{otp}"
