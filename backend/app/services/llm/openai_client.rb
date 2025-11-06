# frozen_string_literal: true

module LLM
  class OpenAIClient
    MAX_RETRIES = 3
    RETRY_DELAYS = [1, 2, 4].freeze # exponential backoff in seconds

    def initialize
      @client = OpenAI::Client.new(access_token: ENV['OPENAI_API_KEY'])
    end

    def parse_resume(text, attempt: 1, validation_errors: nil)
      # Force UTF-8 encoding before sending to OpenAI API
      # The OpenAI gem will fail if text contains invalid UTF-8 sequences
      safe_text = ensure_utf8(text)

      system_prompt = if validation_errors
                        resume_retry_prompt(validation_errors)
                      else
                        resume_system_prompt
                      end

      response = with_retry do
        @client.chat(
          parameters: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: system_prompt },
              { role: 'user', content: safe_text }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          }
        )
      end

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      # Validate the response against JSON schema
      validation_result = JsonSchemaValidatorService.validate_resume(parsed_data)

      # If validation fails and we haven't retried yet, try once more with error feedback
      if !validation_result[:valid] && attempt == 1
        Rails.logger.warn("Resume validation failed on first attempt: #{validation_result[:errors]}")
        return parse_resume(text, attempt: 2, validation_errors: validation_result[:errors])
      end

      {
        parsed_data: parsed_data,
        raw_response: response.to_json,
        validation_result: validation_result,
        attempt: attempt
      }
    rescue JSON::ParserError => e
      Rails.logger.error("JSON parsing failed: #{e.message}")
      {
        parsed_data: nil,
        raw_response: nil,
        validation_result: { valid: false, errors: ["JSON parsing error: #{e.message}"] },
        attempt: attempt,
        error: "Invalid JSON response from LLM"
      }
    rescue StandardError => e
      Rails.logger.error("LLM resume parsing failed: #{e.message}")
      {
        parsed_data: nil,
        raw_response: nil,
        validation_result: { valid: false, errors: [e.message] },
        attempt: attempt,
        error: "LLM error: #{e.message}"
      }
    end

    def parse_job_description(text, attempt: 1, validation_errors: nil)
      # Force UTF-8 encoding before sending to OpenAI API
      safe_text = ensure_utf8(text)

      system_prompt = if validation_errors
                        job_retry_prompt(validation_errors)
                      else
                        job_system_prompt
                      end

      response = with_retry do
        @client.chat(
          parameters: {
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: system_prompt },
              { role: 'user', content: safe_text }
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          }
        )
      end

      parsed_data = JSON.parse(response.dig('choices', 0, 'message', 'content'))

      # Validate the response against JSON schema
      validation_result = JsonSchemaValidatorService.validate_job_description(parsed_data)

      # If validation fails and we haven't retried yet, try once more with error feedback
      if !validation_result[:valid] && attempt == 1
        Rails.logger.warn("Job description validation failed on first attempt: #{validation_result[:errors]}")
        return parse_job_description(text, attempt: 2, validation_errors: validation_result[:errors])
      end

      {
        parsed_data: parsed_data,
        raw_response: response.to_json,
        validation_result: validation_result,
        attempt: attempt
      }
    rescue JSON::ParserError => e
      Rails.logger.error("JSON parsing failed: #{e.message}")
      {
        parsed_data: nil,
        raw_response: nil,
        validation_result: { valid: false, errors: ["JSON parsing error: #{e.message}"] },
        attempt: attempt,
        error: "Invalid JSON response from LLM"
      }
    rescue StandardError => e
      Rails.logger.error("LLM job parsing failed: #{e.message}")
      {
        parsed_data: nil,
        raw_response: nil,
        validation_result: { valid: false, errors: [e.message] },
        attempt: attempt,
        error: "LLM error: #{e.message}"
      }
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

    def resume_system_prompt
      <<~PROMPT
        You are a professional resume parser. Extract structured information from resume text.

        CRITICAL RULES:
        1. Return ONLY a single valid JSON object conforming to the schema below
        2. DO NOT include any explanatory text, markdown, or comments
        3. When a value cannot be found, set it to null (NOT empty string "")
        4. For array fields (skills, experience, education): use empty array [] if none found
        5. For top_skills: return exactly 5 strings; if fewer than 5 exist, pad with null
        6. All dates must be in YYYY-MM format or 'Present'
        7. DO NOT guess or hallucinate data - use null for unknown fields

        REQUIRED JSON SCHEMA:
        {
          "personal_info": {
            "name": null or string,
            "email": null or string,
            "phone": null or string,
            "location": null or string,
            "linkedin": null or string,
            "github": null or string,
            "portfolio": null or string
          },
          "summary": null or string,
          "top_skills": [string1, string2, string3, string4, string5],  // exactly 5 items, pad with null
          "skills": [
            {
              "name": string or null,
              "category": "Frontend" or "Backend" or "Database" or "DevOps" or "Soft Skills" or "Other" or null,
              "proficiency": "Beginner" or "Intermediate" or "Advanced" or null
            }
          ],
          "experience": [
            {
              "company": null or string,
              "title": null or string,
              "location": null or string,
              "start_date": null or "YYYY-MM",
              "end_date": null or "YYYY-MM" or "Present",
              "duration": null or string,
              "responsibilities": [],
              "achievements": []
            }
          ],
          "education": [
            {
              "institution": null or string,
              "degree": null or string,
              "field": null or string,
              "location": null or string,
              "graduation_year": null or "YYYY",
              "gpa": null or string
            }
          ],
          "certifications": [
            {
              "name": null or string,
              "issuer": null or string,
              "date": null or "YYYY-MM",
              "expiry_date": null or "YYYY-MM",
              "credential_id": null or string
            }
          ],
          "projects": [
            {
              "name": null or string,
              "description": null or string,
              "technologies": [],
              "url": null or string
            }
          ],
          "languages": [
            {
              "language": null or string,
              "proficiency": "Native" or "Fluent" or "Professional" or "Basic" or null
            }
          ]
        }

        Return ONLY the JSON object, nothing else.
      PROMPT
    end

    def resume_retry_prompt(validation_errors)
      errors_text = validation_errors.join("; ")
      <<~PROMPT
        Your previous response failed validation for these reasons:
        #{errors_text}

        Please return ONLY valid JSON conforming to the schema.
        Set unknown fields to null (NOT empty strings).
        For arrays, use [] if no data found.
        For top_skills, return exactly 5 items (pad with null if fewer).
        DO NOT guess or hallucinate data.

        Return ONLY the corrected JSON object, no additional text.
      PROMPT
    end

    def job_system_prompt
      <<~PROMPT
        You are an expert job description parser. Extract key information from job postings.

        CRITICAL RULES:
        1. Return ONLY a single valid JSON object conforming to the schema below
        2. DO NOT include any explanatory text, markdown, or comments
        3. When a value cannot be found, set it to null (NOT empty string "")
        4. For arrays: use empty array [] if no data found
        5. For top_5_skills_needed: return exactly up to 5 strings; if fewer, pad with null
        6. job_type MUST be one of: "full_time", "part_time", "seasonal", "contract", "permanent" or null
        7. DO NOT guess or hallucinate data - use null for unknown fields

        REQUIRED JSON SCHEMA:
        {
          "title": null or string,
          "company_name": null or string,
          "location": null or string,
          "job_location": null or string,
          "remote_type": "Remote" or "Hybrid" or "On-site" or null,
          "job_type": "full_time" or "part_time" or "seasonal" or "contract" or "permanent" or null,
          "experience_level": "Entry" or "Junior" or "Mid" or "Senior" or "Lead" or null,
          "years_of_experience": null or string,
          "education_requirement": null or string,
          "salary_range": {
            "min": null or integer,
            "max": null or integer,
            "currency": null or string,
            "period": null or string
          } or null,
          "top_5_skills_needed": [string1, string2, string3, string4, string5],  // up to 5 items, pad with null
          "skills_required": [
            {
              "name": null or string,
              "category": null or string,
              "importance": "Required" or "Preferred" or null
            }
          ],
          "skills_nice_to_have": [],
          "responsibilities": [],
          "qualifications": [],
          "benefits": [],
          "application_deadline": null or "YYYY-MM-DD",
          "requires_bilingual": null or boolean,
          "languages_required": [],
          "industry": null or string,
          "company_size": null or string,
          "visa_sponsorship": null or boolean,
          "security_clearance_required": null or boolean,
          "travel_required": null or string
        }

        Return ONLY the JSON object, nothing else.
      PROMPT
    end

    def job_retry_prompt(validation_errors)
      errors_text = validation_errors.join("; ")
      <<~PROMPT
        Your previous response failed validation for these reasons:
        #{errors_text}

        Please return ONLY valid JSON conforming to the schema.
        Set unknown fields to null (NOT empty strings).
        For arrays, use [] if no data found.
        For top_5_skills_needed, return up to 5 items (pad with null if fewer).
        job_type MUST be: "full_time", "part_time", "seasonal", "contract", "permanent", or null.
        DO NOT guess or hallucinate data.

        Return ONLY the corrected JSON object, no additional text.
      PROMPT
    end
  end
end
