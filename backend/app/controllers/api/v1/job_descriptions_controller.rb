# frozen_string_literal: true

module Api
  module V1
    class JobDescriptionsController < BaseController
      before_action :authenticate_user!
      before_action :set_job_description, only: [:show, :destroy, :status]

      # POST /api/v1/job_descriptions
      def create
        @job_description = current_user.job_descriptions.build(job_description_params)

        if @job_description.save
          render json: {
            data: {
              id: @job_description.id,
              status: @job_description.status,
              url: @job_description.url,
              created_at: @job_description.created_at
            }
          }, status: :created
        else
          render json: {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: @job_description.errors.messages
            }
          }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/job_descriptions
      def index
        @job_descriptions = current_user.job_descriptions.order(created_at: :desc)

        render json: {
          data: @job_descriptions.map { |job|
            {
              id: job.id,
              title: job.title,
              company_name: job.company_name,
              url: job.url,
              status: job.status,
              parsed_attributes: job.parsed_attributes,
              error_message: job.error_message,
              created_at: job.created_at,
              updated_at: job.updated_at
            }
          }
        }
      end

      # GET /api/v1/job_descriptions/:id
      def show
        render json: {
          data: {
            id: @job_description.id,
            title: @job_description.title,
            company_name: @job_description.company_name,
            url: @job_description.url,
            raw_text: @job_description.raw_text,
            status: @job_description.status,
            parsed_attributes: @job_description.parsed_attributes,
            error_message: @job_description.error_message,
            created_at: @job_description.created_at,
            updated_at: @job_description.updated_at
          }
        }
      end

      # DELETE /api/v1/job_descriptions/:id
      def destroy
        @job_description.destroy
        render json: {
          data: { message: 'Job description deleted successfully' }
        }, status: :ok
      end

      # GET /api/v1/job_descriptions/:id/status
      def status
        render json: {
          data: {
            id: @job_description.id,
            status: @job_description.status,
            error_message: @job_description.error_message
          }
        }
      end

      private

      def set_job_description
        @job_description = current_user.job_descriptions.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: 'Job description not found' }, status: :not_found
      end

      def job_description_params
        params.require(:job_description).permit(:url, :raw_text)
      end
    end
  end
end
