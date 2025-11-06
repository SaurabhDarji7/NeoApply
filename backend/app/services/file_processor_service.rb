# frozen_string_literal: true

class FileProcessorService
  def self.extract_text(active_storage_blob)
    # Download file to temp location (works with both local and cloud storage)
    # IMPORTANT: Open in binary mode to handle PDF/DOCX binary data
    temp_file = Tempfile.new(['upload', File.extname(active_storage_blob.filename.to_s)])
    temp_file.binmode

    begin
      # Download blob to temp file
      active_storage_blob.download { |chunk| temp_file.write(chunk) }
      temp_file.rewind
      file_path = temp_file.path

      # Route to appropriate parser
      case active_storage_blob.content_type
      when 'application/pdf'
        ::PdfParser.extract(file_path)
      when 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ::DocxParser.extract(file_path)
      when 'text/plain'
        ::TextParser.extract(file_path)
      else
        raise "Unsupported file type: #{active_storage_blob.content_type}"
      end
    ensure
      # Clean up temp file
      temp_file.close
      temp_file.unlink
    end
  end
end
