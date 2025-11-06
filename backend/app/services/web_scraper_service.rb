# frozen_string_literal: true

require 'resolv'

class WebScraperService
  USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  ].freeze

  # Private IP ranges to block SSRF attacks
  PRIVATE_IP_RANGES = [
    IPAddr.new('10.0.0.0/8'),
    IPAddr.new('172.16.0.0/12'),
    IPAddr.new('192.168.0.0/16'),
    IPAddr.new('127.0.0.0/8'),
    IPAddr.new('169.254.0.0/16'),
    IPAddr.new('::1/128'),
    IPAddr.new('fc00::/7'),
    IPAddr.new('fe80::/10')
  ].freeze

  def self.scrape(url)
    # Validate URL format and scheme
    validate_url!(url)

    response = HTTParty.get(url, headers: { 'User-Agent' => USER_AGENTS.sample }, timeout: 30)

    raise "HTTP Error: #{response.code}" unless response.success?

    doc = Nokogiri::HTML(response.body)
    extract_job_text(doc, url)
  rescue HTTParty::Error, Net::OpenTimeout => e
    Rails.logger.error("Web scraping failed for #{url}: #{e.message}")
    raise "Failed to scrape URL: #{e.message}"
  end

  private

  def self.validate_url!(url)
    uri = URI.parse(url)

    # Only allow HTTP/HTTPS
    unless %w[http https].include?(uri.scheme)
      raise "Invalid URL scheme: #{uri.scheme}. Only HTTP/HTTPS allowed"
    end

    # Block localhost, private IPs, and link-local addresses
    hostname = uri.host
    raise "Invalid URL: missing hostname" if hostname.blank?

    # Resolve hostname to IP and check against private ranges
    begin
      addresses = Resolv.getaddresses(hostname)
      addresses.each do |address|
        ip = IPAddr.new(address)
        if PRIVATE_IP_RANGES.any? { |range| range.include?(ip) }
          raise "Access to private IP addresses is not allowed: #{address}"
        end
      end
    rescue Resolv::ResolvError
      raise "Could not resolve hostname: #{hostname}"
    end
  end

  def self.extract_job_text(doc, url)
    # Remove script and style tags
    doc.css('script, style, nav, header, footer').remove

    # Try common job board selectors
    selectors = [
      '.job-description',
      '.description',
      '[class*="description"]',
      '[id*="description"]',
      '[class*="job-details"]',
      '[id*="job-details"]',
      'article',
      'main',
      'body'
    ]

    selectors.each do |selector|
      element = doc.css(selector).first
      next unless element

      text = element.text.strip.gsub(/\s+/, ' ')
      return text if text.length > 100 # Ensure we got meaningful content
    end

    raise "Could not extract job description from URL"
  end
end
