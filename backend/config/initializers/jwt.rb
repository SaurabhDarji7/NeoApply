# frozen_string_literal: true

# Validate JWT_SECRET_KEY is set
if ENV['JWT_SECRET_KEY'].blank?
  raise 'JWT_SECRET_KEY environment variable must be set'
end

# Warn if using the default development key in production
if Rails.env.production? && ENV['JWT_SECRET_KEY'] == 'development-secret-key-change-in-production'
  raise 'JWT_SECRET_KEY must be changed in production!'
end
