# frozen_string_literal: true

Devise.setup do |config|
  # The secret key used by Devise. Devise uses this key to generate
  # random tokens. Changing this key will render invalid all existing
  # confirmation, reset password and unlock tokens in the database.
  config.secret_key = ENV['JWT_SECRET_KEY'] || Rails.application.credentials.secret_key_base

  # ==> Mailer Configuration
  # Configure the e-mail address which will be shown in Devise::Mailer,
  # note that it will be overwritten if you use your own mailer class
  # with default "from" parameter.
  config.mailer_sender = 'noreply@neoapply.com'

  # Configure the class responsible to send e-mails.
  # config.mailer = 'Devise::Mailer'

  # ==> ORM configuration
  require 'devise/orm/active_record'

  # ==> Configuration for any authentication mechanism
  # Configure which keys are used when authenticating a user.
  config.authentication_keys = [:email]

  # Configure parameters from the request object used for authentication.
  config.request_keys = []

  # If http authentication is enabled by default, you can disable it here.
  # config.http_authenticatable = false

  # ==> Configuration for :database_authenticatable
  # Define which will be the encryption algorithm. Devise uses bcrypt by default.
  config.stretches = Rails.env.test? ? 1 : 12

  # ==> Configuration for :validatable
  # Range for password length.
  config.password_length = 8..128

  # Email regex used to validate email formats.
  config.email_regexp = /\A[^@\s]+@[^@\s]+\z/

  # ==> Configuration for :recoverable
  # Time interval you can reset your password with a reset password key.
  config.reset_password_within = 6.hours

  # ==> Configuration for :rememberable
  # The time the user will be remembered without asking for credentials again.
  config.remember_for = 2.weeks

  # ==> Configuration for :validatable
  # Range validation for password length. Default is 6..128.
  # config.password_length = 6..128

  # ==> Navigation configuration
  # If you want to use other strategies, that are not supported by Devise, or
  # change the failure app, you can configure them inside the config.warden block.
  config.warden do |manager|
    # manager.intercept_401 = false
    # manager.default_strategies(scope: :user).unshift :some_external_strategy
  end

  # ==> JWT Configuration (for devise-jwt)
  config.jwt do |jwt|
    jwt.secret = ENV['JWT_SECRET_KEY']
    jwt.dispatch_requests = [
      ['POST', %r{^/api/v1/auth/login$}]
    ]
    jwt.revocation_requests = [
      ['DELETE', %r{^/api/v1/auth/logout$}]
    ]
    jwt.expiration_time = 1.hour.to_i
  end
end
