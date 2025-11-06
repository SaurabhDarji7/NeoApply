# frozen_string_literal: true

class JobParserService
  def initialize(job_description)
    @job_description = job_description
  end

  def parse
    @job_description.update!(status: 'parsing')

    # Parse with LLM
    parsed_data = ::LLMService.parse_job_description(@job_description.raw_text)

    # Save to database
    @job_description.update!(
      status: 'completed',
      title: parsed_data['title'] || parsed_data['company_name'],
      company_name: parsed_data['company_name'] || parsed_data['company'],
      parsed_attributes: parsed_data
    )

    parsed_data
  rescue => e
    @job_description.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end
end
