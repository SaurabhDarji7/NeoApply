require_relative "boot"

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
# require "action_mailbox/engine"
# require "action_text/engine"
require "action_view/railtie"
# require "action_cable/engine"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    # API-only application
    config.api_only = true

    # Don't generate system test files.
    config.generators.system_tests = nil

    config.autoload_paths += %W(#{config.root}/app/lib)
    config.autoload_paths += %W(#{config.root}/app/services)

    # Middleware configuration
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # Timezone
    config.time_zone = 'UTC'
    config.active_record.default_timezone = :utc
  end
end
