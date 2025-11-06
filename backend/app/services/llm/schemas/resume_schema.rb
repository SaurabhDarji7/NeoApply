# frozen_string_literal: true

module LLM
  module Schemas
    class ResumeSchema
      def self.json_schema
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

      def self.system_prompt
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
    end
  end
end
