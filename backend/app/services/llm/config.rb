# frozen_string_literal: true

module LLM
  class Config
    MODELS = {
      parsing: 'gpt-4o-mini',
      generation: 'gpt-4o-mini',
      default: 'gpt-4o-mini'
    }.freeze

    TEMPERATURES = {
      parsing: 0.3,
      generation: 0.7,
      default: 0.7
    }.freeze

    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 2, 4].freeze

    TOKEN_LIMITS = {
      max_input_chars: 50_000,
      chars_per_token_estimate: 4,
      min_completion_tokens: 150,
      default_max_tokens: 2000
    }.freeze

    RESPONSE_FORMATS = {
      json_schema: 'json_schema',
      json_object: 'json_object',
      text: 'text'
    }.freeze

    class << self
      def model_for(operation)
        MODELS[operation] || MODELS[:default]
      end

      def temperature_for(operation)
        TEMPERATURES[operation] || TEMPERATURES[:default]
      end

      def calculate_max_tokens(char_length, min_tokens: nil)
        estimated = char_length / TOKEN_LIMITS[:chars_per_token_estimate]
        minimum = min_tokens || TOKEN_LIMITS[:min_completion_tokens]
        [estimated, minimum].max.to_i
      end

      def retry_config
        {
          max_retries: MAX_RETRIES,
          delays: RETRY_DELAYS
        }
      end

      def validate_input_length(text, max_chars: nil)
        max_length = max_chars || TOKEN_LIMITS[:max_input_chars]

        if text.length > max_length
          Rails.logger.warn("Input text truncated from #{text.length} to #{max_length} chars")
          truncated = text[0...max_length]
          "#{truncated}\n\n[Content truncated due to length]"
        else
          text
        end
      end

      def json_schema_format(name:, schema:, strict: true)
        {
          type: RESPONSE_FORMATS[:json_schema],
          json_schema: {
            name: name,
            schema: schema,
            strict: strict
          }
        }
      end

      def api_key_configured?
        ENV['OPENAI_API_KEY'].present?
      end

      def api_key
        ENV['OPENAI_API_KEY'] || raise('OPENAI_API_KEY environment variable not set')
      end
    end
  end
end
