require 'json-schema'

class JsonSchemaValidatorService
  RESUME_SCHEMA = {
    type: 'object',
    required: ['personal_info', 'skills', 'experience'],
    properties: {
      personal_info: {
        type: ['object', 'null'],
        properties: {
          name: { type: ['string', 'null'] },
          email: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
          location: { type: ['string', 'null'] },
          linkedin: { type: ['string', 'null'] },
          github: { type: ['string', 'null'] },
          portfolio: { type: ['string', 'null'] }
        }
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
          type: ['object', 'null'],
          properties: {
            name: { type: ['string', 'null'] },
            category: { type: ['string', 'null'] },
            proficiency: { type: ['string', 'null'] }
          }
        }
      },
      experience: {
        type: 'array',
        items: {
          type: ['object', 'null'],
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
          }
        }
      },
      education: {
        type: 'array',
        items: {
          type: ['object', 'null'],
          properties: {
            institution: { type: ['string', 'null'] },
            degree: { type: ['string', 'null'] },
            field: { type: ['string', 'null'] },
            location: { type: ['string', 'null'] },
            graduation_year: { type: ['string', 'null'] },
            gpa: { type: ['string', 'null'] }
          }
        }
      },
      certifications: {
        type: 'array',
        items: {
          type: ['object', 'null'],
          properties: {
            name: { type: ['string', 'null'] },
            issuer: { type: ['string', 'null'] },
            date: { type: ['string', 'null'] },
            expiry_date: { type: ['string', 'null'] },
            credential_id: { type: ['string', 'null'] }
          }
        }
      },
      projects: {
        type: 'array',
        items: {
          type: ['object', 'null'],
          properties: {
            name: { type: ['string', 'null'] },
            description: { type: ['string', 'null'] },
            technologies: {
              type: 'array',
              items: { type: ['string', 'null'] }
            },
            url: { type: ['string', 'null'] }
          }
        }
      },
      languages: {
        type: 'array',
        items: {
          type: ['object', 'null'],
          properties: {
            language: { type: ['string', 'null'] },
            proficiency: { type: ['string', 'null'] }
          }
        }
      }
    }
  }.freeze

  JOB_DESCRIPTION_SCHEMA = {
    type: 'object',
    required: ['title', 'company_name'],
    properties: {
      title: { type: ['string', 'null'] },
      company_name: { type: ['string', 'null'] },
      location: { type: ['string', 'null'] },
      job_location: { type: ['string', 'null'] },
      remote_type: {
        type: ['string', 'null'],
        enum: ['Remote', 'Hybrid', 'On-site', nil]
      },
      job_type: {
        type: ['string', 'null'],
        enum: ['full_time', 'part_time', 'seasonal', 'contract', 'permanent', nil]
      },
      experience_level: {
        type: ['string', 'null'],
        enum: ['Entry', 'Junior', 'Mid', 'Senior', 'Lead', nil]
      },
      years_of_experience: { type: ['string', 'null'] },
      education_requirement: { type: ['string', 'null'] },
      salary_range: {
        type: ['object', 'null'],
        properties: {
          min: { type: ['integer', 'null'] },
          max: { type: ['integer', 'null'] },
          currency: { type: ['string', 'null'] },
          period: { type: ['string', 'null'] }
        }
      },
      top_5_skills_needed: {
        type: 'array',
        items: { type: ['string', 'null'] },
        maxItems: 5
      },
      skills_required: {
        type: 'array',
        items: {
          type: ['object', 'string', 'null'],
          properties: {
            name: { type: ['string', 'null'] },
            category: { type: ['string', 'null'] },
            importance: { type: ['string', 'null'] }
          }
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
    }
  }.freeze

  def self.validate_resume(data)
    validate(data, RESUME_SCHEMA, 'Resume')
  end

  def self.validate_job_description(data)
    validate(data, JOB_DESCRIPTION_SCHEMA, 'Job Description')
  end

  def self.validate(data, schema, type)
    errors = JSON::Validator.fully_validate(schema, data)

    if errors.any?
      {
        valid: false,
        errors: errors,
        message: "#{type} validation failed: #{errors.join('; ')}"
      }
    else
      {
        valid: true,
        errors: [],
        message: "#{type} validation passed"
      }
    end
  rescue JSON::Schema::ValidationError => e
    {
      valid: false,
      errors: [e.message],
      message: "#{type} validation error: #{e.message}"
    }
  rescue StandardError => e
    {
      valid: false,
      errors: [e.message],
      message: "Unexpected validation error: #{e.message}"
    }
  end

  def self.format_validation_errors(errors)
    return 'No errors' if errors.blank?

    errors.map.with_index(1) do |error, index|
      "#{index}. #{error}"
    end.join("\n")
  end
end
