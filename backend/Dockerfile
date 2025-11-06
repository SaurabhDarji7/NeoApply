# Use Ruby 3.2.2 Alpine for smaller image size
FROM ruby:3.2.2-alpine

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    tzdata \
    git \
    nodejs \
    yarn \
    bash

# Set working directory
WORKDIR /app

# Copy Gemfile and Gemfile.lock
COPY Gemfile Gemfile.lock ./

# Install gems
RUN bundle lock --add-platform x86_64-linux-musl && bundle install

# Copy application code
COPY . .

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]
