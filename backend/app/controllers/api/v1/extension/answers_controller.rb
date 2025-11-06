# frozen_string_literal: true

module Api
  module V1
    module Extension
      class AnswersController < ApplicationController
        before_action :authenticate_user!

        # POST /api/v1/extension/answers/generate
        def generate
          job_text = params[:job_text]
          resume_id = params[:resume_id]
          fields_metadata = params[:fields_metadata] || []

          if job_text.blank?
            return render json: { error: 'Job text is required' }, status: :bad_request
          end

          resume = current_user.resumes.find_by(id: resume_id)
          unless resume
            return render json: { error: 'Resume not found' }, status: :not_found
          end

          # Generate tailored answers using AI
          service = TailoredAnswerService.new(
            job_text: job_text,
            resume: resume,
            fields_metadata: fields_metadata,
            user: current_user
          )

          suggestions = service.generate

          render json: {
            suggestions: suggestions,
            message: 'Suggestions generated successfully',
            remaining_daily_limit: remaining_limit
          }
        rescue StandardError => e
          Rails.logger.error("TailoredAnswerService error: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))

          render json: {
            error: 'Failed to generate suggestions',
            message: e.message
          }, status: :internal_server_error
        end

        private

        def remaining_limit
          cache_key = "tailored_answers_#{current_user.id}_#{Date.today}"
          used = Rails.cache.read(cache_key) || 0
          [TailoredAnswerService::MAX_GENERATIONS_PER_DAY - used, 0].max
        end
      end
    end
  end
end
