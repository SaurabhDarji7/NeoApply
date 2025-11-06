# frozen_string_literal: true

module LLM
  module Schemas
    class JobDescriptionSchema
      SCHEMA_PATH = Rails.root.join('app', 'services', 'llm', 'schemas', 'job_description_schema.json')

      def self.json_schema
        @json_schema ||= JSON.parse(File.read(SCHEMA_PATH))
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
