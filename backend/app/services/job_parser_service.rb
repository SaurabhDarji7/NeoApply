# frozen_string_literal: true

class JobParserService
  def initialize(job_description)
    @job_description = job_description
  end

  def parse
    @job_description.update!(status: 'parsing')

    # Parse with LLM
    result = ::LLMService.parse_job_description(@job_description.raw_text)

    # Extract the parsed data from the result wrapper
    attributes = result[:parsed_data]

    # Save to database with raw response
    @job_description.update!(
      status: 'completed',
      title: attributes['title'] || attributes['company_name'],
      company_name: attributes['company_name'] || attributes['company'],
      parsed_attributes: attributes,
      raw_llm_response: result[:raw_response]
    )

    attributes
  rescue => e
    @job_description.update!(
      status: 'failed',
      error_message: e.message
    )
    raise
  end
end
