# frozen_string_literal: true

# Solid Queue Configuration
# https://github.com/basecamp/solid_queue

# This configuration will be used when running Solid Queue worker
# To start the worker, run: bundle exec rails solid_queue:start

Rails.application.configure do
  config.solid_queue.connects_to = { database: { writing: :primary } }
end
