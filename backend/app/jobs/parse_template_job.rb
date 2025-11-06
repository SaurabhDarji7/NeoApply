class ParseTemplateJob < ApplicationJob
  queue_as :default

  def perform(template_id)
    template = nil

    begin
      template = Template.find(template_id)

      # Update status and track attempt
      template.update!(
        status: 'parsing',
        started_at: Time.current,
        attempt_count: template.attempt_count + 1
      )

      # Extract text from file or use content_text
      text = if template.file.attached?
               extract_text_from_file(template.file)
             else
               template.content_text
             end

      # Parse with LLM
      result = LLMService.parse_resume(text)

      # Handle the result
      if result[:validation_result][:valid]
        template.update!(
          status: 'completed',
          parsed_attributes: result[:parsed_data],
          raw_llm_response: result[:raw_response],
          completed_at: Time.current,
          error_message: nil
        )

        Rails.logger.info("Template #{template_id} parsed successfully on attempt #{result[:attempt]}")
      else
        error_message = "Parsing failed due to validation errors: #{result[:validation_result][:errors].join('; ')}"
        template.update!(
          status: 'failed',
          error_message: error_message,
          raw_llm_response: result[:raw_response],
          completed_at: Time.current
        )

        Rails.logger.error("Template #{template_id} parsing failed: #{error_message}")
      end
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error("Template #{template_id} not found: #{e.message}")
      raise e if Rails.env.development?
    rescue StandardError => e
      Rails.logger.error("Template #{template_id} parsing error: #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))

      # Only update template if it was found
      if template
        template.update!(
          status: 'failed',
          error_message: "Unexpected error: #{e.message}",
          completed_at: Time.current
        )
      end

      raise e if Rails.env.development? # Re-raise in development for debugging
    end
  end

  private

  def extract_text_from_file(file)
    FileProcessorService.extract_text(file.blob)
  end
end
