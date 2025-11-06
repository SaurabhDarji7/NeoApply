# frozen_string_literal: true

require 'net/http'
require 'json'
require 'tempfile'

class PdfConversionService
  ONLYOFFICE_CONVERSION_URL = "#{ENV.fetch('ONLYOFFICE_URL', 'http://onlyoffice')}/ConvertService.ashx"

  def self.convert_to_pdf(template)
    return { success: false, error: 'No file attached' } unless template.file.attached?

    # Get the document URL
    document_url = Rails.application.routes.url_helpers.rails_blob_url(
      template.file,
      host: ENV.fetch('BACKEND_HOST', 'http://backend:3000'),
      disposition: 'inline'
    )

    # Prepare conversion request
    conversion_request = {
      async: false,
      filetype: 'docx',
      key: "pdf_#{template.id}_#{Time.current.to_i}",
      outputtype: 'pdf',
      title: "#{template.name}.pdf",
      url: document_url
    }

    # Send conversion request to OnlyOffice
    uri = URI(ONLYOFFICE_CONVERSION_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == 'https')
    request = Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
    request.body = conversion_request.to_json

    response = http.request(request)

    if response.is_a?(Net::HTTPSuccess)
      result = JSON.parse(response.body)

      if result['error'].nil? && result['fileUrl']
        # Download the PDF
        pdf_url = result['fileUrl']
        # Replace localhost with internal service name
        internal_pdf_url = pdf_url.gsub('localhost:8080', 'onlyoffice')

        pdf_data = download_pdf(internal_pdf_url)

        if pdf_data
          # Attach PDF to template
          attach_pdf_to_template(template, pdf_data)
          { success: true, pdf_url: rails_pdf_url(template) }
        else
          { success: false, error: 'Failed to download PDF' }
        end
      else
        { success: false, error: result['error'] || 'Conversion failed' }
      end
    else
      { success: false, error: "HTTP #{response.code}: #{response.message}" }
    end
  rescue StandardError => e
    Rails.logger.error("PDF conversion error: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    { success: false, error: e.message }
  end

  def self.download_pdf(url)
    uri = URI(url)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == 'https')
    response = http.get(uri.request_uri)

    response.is_a?(Net::HTTPSuccess) ? response.body : nil
  rescue StandardError => e
    Rails.logger.error("Failed to download PDF: #{e.message}")
    nil
  end

  def self.attach_pdf_to_template(template, pdf_data)
    temp_file = Tempfile.new(['template', '.pdf'])
    temp_file.binmode
    temp_file.write(pdf_data)
    temp_file.rewind

    template.pdf_file.attach(
      io: temp_file,
      filename: "#{template.name}.pdf",
      content_type: 'application/pdf'
    )

    temp_file.close
    temp_file.unlink
  end

  def self.rails_pdf_url(template)
    Rails.application.routes.url_helpers.rails_blob_url(
      template.pdf_file,
      host: ENV.fetch('BACKEND_HOST', 'http://backend:3000'),
      disposition: 'attachment'
    )
  end
end
