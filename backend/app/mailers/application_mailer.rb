# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: ENV.fetch('MAILER_FROM', 'noreply@neoapply.local')
  layout 'mailer'

  # Hook to transform Inky syntax to HTML
  after_action :inline_css

  private

  def inline_css
    message = @_message
    return unless message

    if message.multipart?
      # Transform all HTML parts with Premailer
      message.parts.each do |part|
        next unless part.content_type&.include?('text/html')

        html = part.body.decoded
        html = Inky::Core.new.release_the_kraken(html)
        premailer = Premailer.new(html, with_html_string: true, warn_level: Premailer::Warnings::SAFE)
        part.body = premailer.to_inline_css
        part.content_type = 'text/html; charset=UTF-8'
      end
    else
      # Single-part message: transform the body directly
      if message.content_type.nil? || message.content_type.include?('text/html')
        html = message.body.decoded
        html = Inky::Core.new.release_the_kraken(html)
        premailer = Premailer.new(html, with_html_string: true, warn_level: Premailer::Warnings::SAFE)
        message.body = premailer.to_inline_css
        message.content_type = 'text/html; charset=UTF-8'
      end
    end
  end
end
