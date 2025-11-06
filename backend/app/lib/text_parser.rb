# frozen_string_literal: true

class TextParser
  def self.extract(file_path)
    content = File.read(file_path, mode: 'rb')
    normalize_utf8(content)
  rescue => e
    Rails.logger.error("Text file reading failed: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    raise "Unable to read text file: #{e.message}"
  end

  def self.normalize_utf8(text)
    return "" if text.nil? || text.empty?

    begin
      # Step 1: If it's binary, try to interpret as UTF-8
      if text.encoding == Encoding::ASCII_8BIT
        # Try UTF-8 first
        text = text.dup.force_encoding('UTF-8')
        # If valid UTF-8, scrub and return
        if text.valid_encoding?
          return text.scrub('?')
        end
        # Not valid UTF-8, try ISO-8859-1 (common fallback)
        text = text.force_encoding('ISO-8859-1').encode('UTF-8', invalid: :replace, undef: :replace, replace: '?')
      end

      # Step 2: If already UTF-8, scrub invalid sequences
      if text.encoding == Encoding::UTF_8
        text = text.scrub('?')
        # Force encode again to ensure it's truly valid
        return text.encode('UTF-8', invalid: :replace, undef: :replace, replace: '?')
      end

      # Step 3: Convert any other encoding to UTF-8
      text.encode('UTF-8', invalid: :replace, undef: :replace, replace: '?').scrub('?')
    rescue => e
      Rails.logger.error("UTF-8 normalization failed: #{e.message}")
      Rails.logger.error("Text encoding was: #{text.encoding rescue 'unknown'}")
      # Return empty string as absolute last resort
      ""
    end
  end
end
