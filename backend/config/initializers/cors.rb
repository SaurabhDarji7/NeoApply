# Be sure to restart your server when you modify this file.

# Avoid CORS issues when API is called from the frontend app.
# Handle Cross-Origin Resource Sharing (CORS) in order to accept cross-origin Ajax requests.

# Read more: https://github.com/cyu/rack-cors

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  # Frontend application
  allow do
    origins ENV.fetch('FRONTEND_URL', 'http://localhost:5173')

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end

  # Chrome Extension
  allow do
    # For development: allow any chrome-extension origin
    # For production: specify exact extension ID like 'chrome-extension://abc123...'
    origins(/chrome-extension:\/\/.*/)

    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: false # Extensions use Authorization header, not cookies
  end
end
