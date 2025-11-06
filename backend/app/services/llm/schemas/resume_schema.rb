# frozen_string_literal: true

module LLM
  module Schemas
    class ResumeSchema
      SCHEMA_PATH = Rails.root.join('app', 'services', 'llm', 'schemas', 'resume_schema.json')

      def self.json_schema
        @json_schema ||= JSON.parse(File.read(SCHEMA_PATH))
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
