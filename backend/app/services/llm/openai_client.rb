# frozen_string_literal: true

module LLM
  # Pure OpenAI API client interface
  # Handles only API communication, UTF-8 encoding, and network retry logic
  class OpenAIClient
    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 2, 4].freeze # exponential backoff in seconds

    def initialize
      @client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    end

    # Generic chat method that accepts any parameters
    # @param model [String] The OpenAI model to use
    # @param messages [Array<Hash>] Array of message hashes with :role and :content
    # @param temperature [Float] Temperature setting for the model
    # @param response_format [Hash] Optional response format configuration
    # @param max_tokens [Integer] Optional max tokens limit
    # @return [Hash] The raw OpenAI API response
    def chat(model:, messages:, temperature: 0.7, response_format: nil, max_tokens: nil)
      # Ensure all message content is UTF-8 encoded
      safe_messages = messages.map do |msg|
        {
          role: msg[:role],
          content: ensure_utf8(msg[:content].to_s)
        }
      end

      # Build parameters
      params = {
        model: model,
        messages: safe_messages,
        temperature: temperature
      }
      params[:response_format] = response_format if response_format
      params[:max_tokens] = max_tokens if max_tokens

      # Execute with retry logic
      with_retry do
        @client.chat(parameters: params)
      end
    end

    private

    # Retry logic with exponential backoff for transient errors only
    def with_retry
      retries = 0
      begin
        yield
      rescue OpenAI::Error => e
        # Only retry on transient errors (5xx, timeouts, connection errors)
        if retriable_error?(e) && retries < MAX_RETRIES
          delay = RETRY_DELAYS[retries]
          Rails.logger.warn("Transient OpenAI error (attempt #{retries + 1}/#{MAX_RETRIES}): #{e.message}. Retrying in #{delay}s...")
          sleep(delay)
          retries += 1
          retry
        else
          # Don't retry on 4xx errors or after max retries
          Rails.logger.error("OpenAI error (#{e.class}): #{e.message}")
          raise
        end
      end
    end

    def retriable_error?(error)
      # Retry only on server errors (5xx) and connection issues
      error.message.match?(/5\d\d/) ||
        error.is_a?(Faraday::TimeoutError) ||
        error.is_a?(Faraday::ConnectionFailed)
    end

    # Ensures text is valid UTF-8 before sending to OpenAI API
    # The OpenAI gem/JSON encoding will fail on invalid UTF-8 sequences
    def ensure_utf8(text)
      Rails.logger.info "=== ENSURE_UTF8 CALLED ==="
      Rails.logger.info "Input encoding: #{text.encoding.name rescue 'unknown'}"
      Rails.logger.info "Input length: #{text.length rescue 0}"
      Rails.logger.info "Input valid?: #{text.valid_encoding? rescue false}"

      return "" if text.nil? || text.empty?

      # If it's already valid UTF-8, return as-is
      if text.encoding == Encoding::UTF_8 && text.valid_encoding?
        Rails.logger.info "Text already valid UTF-8, returning as-is"
        return text
      end

      Rails.logger.info "Converting encoding..."
      # Force to UTF-8, replacing invalid bytes
      if text.encoding == Encoding::ASCII_8BIT
        Rails.logger.info "Detected ASCII-8BIT, trying UTF-8 first..."
        # Try UTF-8 first
        utf8_text = text.dup.force_encoding('UTF-8')
        if utf8_text.valid_encoding?
          Rails.logger.info "UTF-8 interpretation successful"
          return utf8_text.scrub('?')
        end

        Rails.logger.info "UTF-8 failed, falling back to ISO-8859-1"
        # Fallback to ISO-8859-1
        text = text.force_encoding('ISO-8859-1')
      end

      # Convert to UTF-8 with replacement
      result = text.encode('UTF-8', invalid: :replace, undef: :replace, replace: '?').scrub('?')
      Rails.logger.info "Conversion complete, result encoding: #{result.encoding.name}, valid: #{result.valid_encoding?}"
      result
    rescue => e
      Rails.logger.error("UTF-8 encoding failed in OpenAI client: #{e.message}")
      Rails.logger.error("Text encoding was: #{text.encoding rescue 'unknown'}")
      Rails.logger.error e.backtrace.join("\n")
      ""
    end
  end
end
