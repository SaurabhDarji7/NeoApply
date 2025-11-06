module Api
  module V1
    class ResumesController < BaseController
      before_action :set_resume, only: [:show, :destroy, :status, :download]

      # GET /api/v1/resumes
      def index
        resumes = current_user.resumes.recent

        # Optional filter by status
        resumes = resumes.where(status: params[:status]) if params[:status].present?

        render json: {
          data: resumes.map { |resume| resume_response(resume) }
        }, status: :ok
      end

      # GET /api/v1/resumes/:id
      def show
        render json: {
          data: resume_response(@resume, include_parsed_data: true)
        }, status: :ok
      end

      # POST /api/v1/resumes
      def create
        resume = current_user.resumes.new(resume_params)

        if resume.save
          render json: {
            data: resume_response(resume),
            meta: { message: 'Resume uploaded successfully. Parsing in progress.' }
          }, status: :created
        else
          render json: {
            error: {
              message: 'Failed to upload resume',
              code: 'VALIDATION_ERROR',
              details: resume.errors.messages
            }
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/resumes/:id
      def destroy
        @resume.destroy!
        head :no_content
      end

      # GET /api/v1/resumes/:id/status
      def status
        render json: {
          data: {
            id: @resume.id,
            status: @resume.status,
            error_message: @resume.error_message
          }
        }, status: :ok
      end

      # GET /api/v1/resumes/:id/download
      def download
        if @resume.file.attached?
          redirect_to rails_blob_path(@resume.file, disposition: 'attachment')
        else
          render json: {
            error: {
              message: 'File not found',
              code: 'NOT_FOUND'
            }
          }, status: :not_found
        end
      end

      private

      def set_resume
        @resume = current_user.resumes.find(params[:id])
      end

      def resume_params
        params.require(:resume).permit(:name, :file, :content_text)
      end

      def resume_response(resume, include_parsed_data: false)
        response = {
          id: resume.id,
          name: resume.name,
          status: resume.status,
          file: resume.file_info,
          created_at: resume.created_at,
          updated_at: resume.updated_at
        }

        response[:parsed_data] = resume.parsed_data if include_parsed_data && resume.parsed_data.present?
        response[:error_message] = resume.error_message if resume.status == 'failed'

        response
      end
    end
  end
end
