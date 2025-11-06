# frozen_string_literal: true

module LLM
  class ParserRegistry
    @parsers = {}

    class << self
      def register(type, parser_class)
        @parsers[type] = parser_class
      end

      def get(type)
        parser_class = @parsers[type]
        raise ArgumentError, "Unknown parser type: #{type}. Available: #{@parsers.keys.join(', ')}" unless parser_class

        parser_class.new
      end

      def registered_types
        @parsers.keys
      end
    end
  end
end
