# frozen_string_literal: true

module LLM
  class OpenAIClient
    def initialize
      @client = OpenAI::Client.new(access_token: Config.api_key)
    end

    def chat(model:, messages:, temperature: 0.7, response_format: nil, max_tokens: nil)
      safe_messages = messages.map do |msg|
        {
          role: msg[:role],
          content: ensure_utf8(msg[:content].to_s)
        }
      end

      params = {
        model: model,
        messages: safe_messages,
        temperature: temperature
      }
      params[:response_format] = response_format if response_format
      params[:max_tokens] = max_tokens if max_tokens

      with_retry do
        @client.chat(parameters: params)
      end
    end

    private

    def with_retry
      retry_config = Config.retry_config
      max_retries = retry_config[:max_retries]
      retry_delays = retry_config[:delays]

      retries = 0
      begin
        yield
      rescue OpenAI::Error => e
        if retriable_error?(e) && retries < max_retries
          delay = retry_delays[retries]
          Rails.logger.warn("Transient OpenAI error (attempt #{retries + 1}/#{max_retries}): #{e.message}. Retrying in #{delay}s...")
          sleep(delay)
          retries += 1
          retry
        else
          Rails.logger.error("OpenAI error (#{e.class}): #{e.message}")
          raise
        end
      end
    end

    def retriable_error?(error)
      error.message.match?(/5\d\d/) ||
        error.is_a?(Faraday::TimeoutError) ||
        error.is_a?(Faraday::ConnectionFailed)
    end

    def ensure_utf8(text)
      Rails.logger.info "=== ENSURE_UTF8 CALLED ==="
      Rails.logger.info "Input encoding: #{text.encoding.name rescue 'unknown'}"
      Rails.logger.info "Input length: #{text.length rescue 0}"
      Rails.logger.info "Input valid?: #{text.valid_encoding? rescue false}"

      return "" if text.nil? || text.empty?

      if text.encoding == Encoding::UTF-8 && text.valid_encoding?
        Rails.logger.info "Text already valid UTF-8, returning as-is"
        return text
      end

      Rails.logger.info "Converting encoding..."
      if text.encoding == Encoding::ASCII_8BIT
        Rails.logger.info "Detected ASCII-8BIT, trying UTF-8 first..."
        utf8_text = text.dup.force_encoding('UTF-8')
        if utf8_text.valid_encoding?
          Rails.logger.info "UTF-8 interpretation successful"
          return utf8_text.scrub('?')
        end

        Rails.logger.info "UTF-8 failed, falling back to ISO-8859-1"
        text = text.force_encoding('ISO-8859-1')
      end

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
