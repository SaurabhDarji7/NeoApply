# frozen_string_literal: true

require 'net/http'
require 'json'

class OnlyofficeService
  ONLYOFFICE_URL = ENV.fetch('ONLYOFFICE_URL', 'http://onlyoffice')
  # Use backend service name for callback URL (OnlyOffice container needs to reach backend)
  CALLBACK_URL_BASE = ENV.fetch('APP_HOST', 'backend:3000')

  def self.generate_document_config(template, user, mode: 'edit')
    file_url = generate_file_url(template)
    callback_url = generate_callback_url(template)

    {
      documentType: document_type(template),
      document: {
        fileType: file_extension(template),
        key: document_key(template),
        title: template.name,
        url: file_url,
        permissions: {
          edit: mode == 'edit',
          download: true,
          print: true,
          review: mode == 'edit'
        }
      },
      editorConfig: {
        mode: mode, # 'edit' or 'view'
        lang: 'en',
        callbackUrl: callback_url,
        user: {
          id: user.id.to_s,
          name: user.email
        },
        customization: {
          autosave: true,
          forcesave: true,
          comments: false,
          chat: false,
          compactHeader: true,
          compactToolbar: true,
          hideRightMenu: false,
          plugins: true,
          macros: false
        },
        plugins: {
          autostart: [
            'asc.{template-helper-plugin-guid-001}'
          ],
          pluginsData: [
            "#{ENV.fetch('ONLYOFFICE_PUBLIC_URL', 'http://localhost:8080')}/sdkjs-plugins/custom/template-helper/config.json"
          ]
        }
      },
      type: 'desktop' # desktop or mobile
    }
  end

  def self.generate_file_url(template)
    # Generate a publicly accessible signed URL for the template file
    # This uses Rails blob URL which is publicly accessible without authentication
    # OnlyOffice container can access this directly
    if template.file.attached?
      # Generate public blob URL that OnlyOffice can access
      # Using backend service name so OnlyOffice container can reach it
      Rails.application.routes.url_helpers.rails_blob_url(
        template.file,
        host: ENV.fetch('BACKEND_HOST', 'http://backend:3000'),
        disposition: 'inline'
      )
    else
      raise 'No file attached to template'
    end
  end

  def self.generate_callback_url(template)
    # OnlyOffice will call this URL to save the document
    "http://#{CALLBACK_URL_BASE}/api/v1/templates/#{template.id}/onlyoffice_callback"
  end

  def self.document_key(template)
    # Unique key for the document version
    # Change this when document is modified to force OnlyOffice to reload
    "#{template.id}_#{template.updated_at.to_i}"
  end

  def self.file_extension(template)
    if template.file.attached?
      File.extname(template.file.filename.to_s).delete('.')
    else
      'docx'
    end
  end

  def self.document_type(template)
    # word, cell, or slide
    ext = file_extension(template)
    case ext
    when 'docx', 'doc', 'odt', 'txt', 'rtf', 'pdf'
      'word'
    when 'xlsx', 'xls', 'ods', 'csv'
      'cell'
    when 'pptx', 'ppt', 'odp'
      'slide'
    else
      'word'
    end
  end

  # Handle callback from OnlyOffice when document is saved
  def self.handle_callback(template, callback_data)
    status = callback_data['status'].to_i

    case status
    when 1
      # Document is being edited
      { error: 0 }
    when 2
      # Document is ready for saving
      if callback_data['url'].present?
        download_and_save_document(template, callback_data['url'])
        { error: 0 }
      else
        { error: 1, message: 'No download URL provided' }
      end
    when 3
      # Document saving error
      { error: 1, message: 'Document saving error' }
    when 4
      # Document closed with no changes
      { error: 0 }
    when 6, 7
      # Document being edited or saving in progress
      { error: 0 }
    else
      { error: 0 }
    end
  end

  def self.download_and_save_document(template, download_url)
    # OnlyOffice sends URLs with the public-facing hostname (localhost:8080)
    # Replace with internal service name so backend container can reach it
    internal_url = download_url.gsub('localhost:8080', 'onlyoffice')

    uri = URI(internal_url)
    response = Net::HTTP.get_response(uri)

    if response.is_a?(Net::HTTPSuccess)
      # Save the updated document
      temp_file = Tempfile.new(['template', '.docx'])
      temp_file.binmode
      temp_file.write(response.body)
      temp_file.rewind

      template.file.attach(
        io: temp_file,
        filename: template.file.filename.to_s,
        content_type: template.file.content_type
      )

      template.touch # Update timestamp to change document key
      temp_file.close
      temp_file.unlink

      Rails.logger.info("Template #{template.id} updated from OnlyOffice")
      true
    else
      Rails.logger.error("Failed to download document from OnlyOffice: #{response.code}")
      false
    end
  end
end
