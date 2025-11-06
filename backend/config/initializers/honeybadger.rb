# frozen_string_literal: true

Honeybadger.configure do |config|
  config.api_key = ENV['HONEYBADGER_API_KEY']
  config.env = ENV['RAILS_ENV']

  # Report synchronously in development for immediate feedback
  config.report_data = Rails.env.production?

  # Set the root directory for better error grouping
  config.root = Rails.root.to_s

  # User context for better debugging
  config.before_notify do |notice|
    if defined?(Current) && Current.user
      notice.context[:user_id] = Current.user.id
      notice.context[:user_email] = Current.user.email
    end
  end
end
