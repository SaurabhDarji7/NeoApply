# frozen_string_literal: true

module Api
  module V1
    module Extension
      class ApplicationsController < ApplicationController
        before_action :authenticate_user!
        before_action :set_application, only: [:show, :update, :destroy]

        # GET /api/v1/extension/applications
        def index
          applications = current_user.applications.recent

          # Optional filters
          applications = applications.by_ats(params[:ats_type]) if params[:ats_type].present?
          applications = applications.by_status(params[:status]) if params[:status].present?

          # Pagination
          page = params[:page]&.to_i || 1
          per_page = params[:per_page]&.to_i || 50
          applications = applications.limit(per_page).offset((page - 1) * per_page)

          render json: {
            applications: applications.map { |app| application_json(app) },
            total: current_user.applications.count,
            page: page,
            per_page: per_page
          }
        end

        # GET /api/v1/extension/applications/:id
        def show
          render json: {
            application: application_json(@application)
          }
        end

        # POST /api/v1/extension/applications
        def create
          application = current_user.applications.build(application_params)
          application.applied_at ||= Time.current

          if application.save
            render json: {
              application: application_json(application),
              message: 'Application logged successfully'
            }, status: :created
          else
            render json: {
              error: 'Failed to create application',
              errors: application.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/extension/applications/:id
        def update
          if @application.update(application_params)
            render json: {
              application: application_json(@application),
              message: 'Application updated successfully'
            }
          else
            render json: {
              error: 'Failed to update application',
              errors: @application.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/extension/applications/:id
        def destroy
          @application.destroy
          head :no_content
        end

        private

        def set_application
          @application = current_user.applications.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Application not found' }, status: :not_found
        end

        def application_params
          params.require(:application).permit(
            :company, :role, :url, :ats_type, :status,
            :used_resume_id, :applied_at, :source, :notes
          ).tap do |app_params|
            # Map used_resume_id to resume_id
            if app_params[:used_resume_id].present?
              app_params[:resume_id] = app_params.delete(:used_resume_id)
            end
          end
        end

        def application_json(application)
          {
            id: application.id,
            company: application.company,
            role: application.role,
            url: application.url,
            ats_type: application.ats_type,
            status: application.status,
            applied_at: application.applied_at&.iso8601,
            formatted_applied_at: application.formatted_applied_at,
            source: application.source,
            notes: application.notes,
            resume: application.resume ? resume_summary(application.resume) : nil,
            created_at: application.created_at.iso8601,
            updated_at: application.updated_at.iso8601
          }
        end

        def resume_summary(resume)
          {
            id: resume.id,
            file_name: resume.file.filename.to_s
          }
        end
      end
    end
  end
end
