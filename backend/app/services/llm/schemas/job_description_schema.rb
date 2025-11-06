# frozen_string_literal: true

module LLM
  module Schemas
    class JobDescriptionSchema
      def self.json_schema
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

      def self.system_prompt
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
end
