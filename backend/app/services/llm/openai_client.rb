# frozen_string_literal: true

module LLM
  class OpenAIClient
    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 2, 4].freeze # exponential backoff in seconds

    def initialize
      @client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    end

    def parse_resume(text)
      # Force UTF-8 encoding before sending to OpenAI API
      safe_text = ensure_utf8(text)

      response = with_retry do
        @client.chat(
          parameters: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: resume_system_prompt },
              { role: 'user', content: safe_text }
            ],
            temperature: 0.3,
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'resume_extraction',
                schema: resume_json_schema,
                strict: true
              }
            }
          }
        )
      end

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      # Validate the response against our schema as a safety check
      validation_result = JsonSchemaValidatorService.validate_resume(parsed_data)

      unless validation_result[:valid]
        error = StandardError.new("Resume validation failed: #{validation_result[:errors].join('; ')}")
        LLMServiceErrorReporting.report_validation_error(
          error,
          parsed_data: parsed_data,
          validation_errors: validation_result[:errors],
          operation: 'parse_resume'
        )
        raise error
      end

      parsed_data
    rescue JSON::ParserError => e
      LLMServiceErrorReporting.report_parsing_error(
        e,
        operation: 'parse_resume',
        raw_response: response
      )
      raise StandardError, "Invalid JSON response from LLM: #{e.message}"
    rescue OpenAI::Error => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_resume',
        model: 'gpt-4o-mini'
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_resume',
        model: 'gpt-4o-mini'
      )
      raise
    end

    def parse_job_description(text)
      # Force UTF-8 encoding before sending to OpenAI API
      safe_text = ensure_utf8(text)

      response = with_retry do
        @client.chat(
          parameters: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: job_system_prompt },
              { role: 'user', content: safe_text }
            ],
            temperature: 0.3,
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: 'job_description_extraction',
                schema: job_description_json_schema,
                strict: true
              }
            }
          }
        )
      end

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      # Validate the response against our schema as a safety check
      validation_result = JsonSchemaValidatorService.validate_job_description(parsed_data)

      unless validation_result[:valid]
        error = StandardError.new("Job description validation failed: #{validation_result[:errors].join('; ')}")
        LLMServiceErrorReporting.report_validation_error(
          error,
          parsed_data: parsed_data,
          validation_errors: validation_result[:errors],
          operation: 'parse_job_description'
        )
        raise error
      end

      parsed_data
    rescue JSON::ParserError => e
      LLMServiceErrorReporting.report_parsing_error(
        e,
        operation: 'parse_job_description',
        raw_response: response
      )
      raise StandardError, "Invalid JSON response from LLM: #{e.message}"
    rescue OpenAI::Error => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_job_description',
        model: 'gpt-4o-mini'
      )
      raise
    rescue StandardError => e
      LLMServiceErrorReporting.report_api_error(
        e,
        operation: 'parse_job_description',
        model: 'gpt-4o-mini'
      )
      raise
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

    def resume_json_schema
      {
        type: 'object',
        properties: {
          personal_info: {
            type: 'object',
            properties: {
              name: { type: ['string', 'null'] },
              email: { type: ['string', 'null'] },
              phone: { type: ['string', 'null'] },
              location: { type: ['string', 'null'] },
              linkedin: { type: ['string', 'null'] },
              github: { type: ['string', 'null'] },
              portfolio: { type: ['string', 'null'] }
            },
            required: %w[name email phone location linkedin github portfolio],
            additionalProperties: false
          },
          summary: { type: ['string', 'null'] },
          top_skills: {
            type: 'array',
            items: { type: ['string', 'null'] },
            maxItems: 5
          },
          skills: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: ['string', 'null'] },
                category: { type: ['string', 'null'] },
                proficiency: { type: ['string', 'null'] }
              },
              required: %w[name category proficiency],
              additionalProperties: false
            }
          },
          experience: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                company: { type: ['string', 'null'] },
                title: { type: ['string', 'null'] },
                location: { type: ['string', 'null'] },
                start_date: { type: ['string', 'null'] },
                end_date: { type: ['string', 'null'] },
                duration: { type: ['string', 'null'] },
                responsibilities: {
                  type: 'array',
                  items: { type: ['string', 'null'] }
                },
                achievements: {
                  type: 'array',
                  items: { type: ['string', 'null'] }
                }
              },
              required: %w[company title location start_date end_date duration responsibilities achievements],
              additionalProperties: false
            }
          },
          education: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                institution: { type: ['string', 'null'] },
                degree: { type: ['string', 'null'] },
                field: { type: ['string', 'null'] },
                location: { type: ['string', 'null'] },
                graduation_year: { type: ['string', 'null'] },
                gpa: { type: ['string', 'null'] }
              },
              required: %w[institution degree field location graduation_year gpa],
              additionalProperties: false
            }
          },
          certifications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: ['string', 'null'] },
                issuer: { type: ['string', 'null'] },
                date: { type: ['string', 'null'] },
                expiry_date: { type: ['string', 'null'] },
                credential_id: { type: ['string', 'null'] }
              },
              required: %w[name issuer date expiry_date credential_id],
              additionalProperties: false
            }
          },
          projects: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: ['string', 'null'] },
                description: { type: ['string', 'null'] },
                technologies: {
                  type: 'array',
                  items: { type: ['string', 'null'] }
                },
                url: { type: ['string', 'null'] }
              },
              required: %w[name description technologies url],
              additionalProperties: false
            }
          },
          languages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                language: { type: ['string', 'null'] },
                proficiency: { type: ['string', 'null'] }
              },
              required: %w[language proficiency],
              additionalProperties: false
            }
          }
        },
        required: %w[personal_info summary top_skills skills experience education certifications projects languages],
        additionalProperties: false
      }
    end

    def resume_system_prompt
      <<~PROMPT
        You are a professional resume parser. Extract structured information from resume text.

        CRITICAL RULES:
        1. When a value cannot be found, set it to null (NOT empty string "")
        2. For array fields (skills, experience, education): use empty array [] if none found
        3. For top_skills: return up to 5 strings; use null for missing slots
        4. All dates must be in YYYY-MM format or 'Present'
        5. DO NOT guess or hallucinate data - use null for unknown fields
        6. Extract only information explicitly stated in the resume

        The response will automatically conform to the required JSON schema.
      PROMPT
    end

    def job_description_json_schema
      {
        type: 'object',
        properties: {
          title: { type: ['string', 'null'] },
          company_name: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          job_location: { type: ['string', 'null'] },
          remote_type: { type: ['string', 'null'] },
          job_type: { type: ['string', 'null'] },
          experience_level: { type: ['string', 'null'] },
          years_of_experience: { type: ['string', 'null'] },
          education_requirement: { type: ['string', 'null'] },
          salary_range: {
            type: ['object', 'null'],
            properties: {
              min: { type: ['integer', 'null'] },
              max: { type: ['integer', 'null'] },
              currency: { type: ['string', 'null'] },
              period: { type: ['string', 'null'] }
            },
            required: %w[min max currency period],
            additionalProperties: false
          },
          top_5_skills_needed: {
            type: 'array',
            items: { type: ['string', 'null'] },
            maxItems: 5
          },
          skills_required: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: ['string', 'null'] },
                category: { type: ['string', 'null'] },
                importance: { type: ['string', 'null'] }
              },
              required: %w[name category importance],
              additionalProperties: false
            }
          },
          skills_nice_to_have: {
            type: 'array',
            items: { type: ['string', 'null'] }
          },
          responsibilities: {
            type: 'array',
            items: { type: ['string', 'null'] }
          },
          qualifications: {
            type: 'array',
            items: { type: ['string', 'null'] }
          },
          benefits: {
            type: 'array',
            items: { type: ['string', 'null'] }
          },
          application_deadline: { type: ['string', 'null'] },
          requires_bilingual: { type: ['boolean', 'null'] },
          languages_required: {
            type: 'array',
            items: { type: ['string', 'null'] }
          },
          industry: { type: ['string', 'null'] },
          company_size: { type: ['string', 'null'] },
          visa_sponsorship: { type: ['boolean', 'null'] },
          security_clearance_required: { type: ['boolean', 'null'] },
          travel_required: { type: ['string', 'null'] }
        },
        required: %w[title company_name location job_location remote_type job_type experience_level years_of_experience education_requirement salary_range top_5_skills_needed skills_required skills_nice_to_have responsibilities qualifications benefits application_deadline requires_bilingual languages_required industry company_size visa_sponsorship security_clearance_required travel_required],
        additionalProperties: false
      }
    end

    def job_system_prompt
      <<~PROMPT
        You are an expert job description parser. Extract key information from job postings.

        CRITICAL RULES:
        1. When a value cannot be found, set it to null (NOT empty string "")
        2. For arrays: use empty array [] if no data found
        3. For top_5_skills_needed: return up to 5 strings; use null for missing slots
        4. job_type should be one of: "full_time", "part_time", "seasonal", "contract", "permanent" or null
        5. remote_type should be: "Remote", "Hybrid", "On-site" or null
        6. experience_level should be: "Entry", "Junior", "Mid", "Senior", "Lead" or null
        7. DO NOT guess or hallucinate data - use null for unknown fields
        8. Extract only information explicitly stated in the job description

        The response will automatically conform to the required JSON schema.
      PROMPT
    end
  end
end
