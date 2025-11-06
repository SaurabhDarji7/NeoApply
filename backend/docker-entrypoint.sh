#!/bin/bash
set -e

# Install dependencies if needed
echo "Checking bundle..."
bundle check || bundle install

# Remove a potentially pre-existing server.pid for Rails
rm -f /app/tmp/pids/server.pid

# Execute the main command
# If no arguments, start rails server
if [ $# -eq 0 ]; then
    exec bundle exec rails s -b 0.0.0.0
else
    exec "$@"
fi
