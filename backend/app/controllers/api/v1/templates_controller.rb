# frozen_string_literal: true

module Api
  module V1
    class TemplatesController < BaseController
      before_action :authenticate_user!
      before_action :set_template, only: [:show, :update, :destroy, :download, :parse, :apply_job, :editor_config, :export_pdf]
      skip_before_action :authenticate_user!, only: [:onlyoffice_callback]

      # POST /api/v1/templates
      def create
        @template = current_user.templates.build(template_params)

        if @template.save
          render json: {
            data: template_response(@template),
            meta: { message: 'Template uploaded successfully. Parsing in progress.' }
          }, status: :created
        else
          render json: {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: @template.errors.messages
            }
          }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/templates
      def index
        @templates = current_user.templates
                                 .then { |scope| filter_by_status(scope) }
                                 .order(created_at: :desc)
                                 .page(params[:page] || 1)
                                 .per(params[:per_page] || 10)

        render json: {
          data: @templates.map { |template| template_response(template) },
          meta: pagination_meta(@templates)
        }
      end

      # GET /api/v1/templates/:id
      def show
        # Note: raw_llm_response is excluded by default for regular users
        # Can be included in future if admin role is added
        render json: {
          data: template_response(@template, include_raw: false)
        }
      end

      # PUT /api/v1/templates/:id
      def update
        if @template.update(template_update_params)
          render json: {
            data: template_response(@template)
          }
        else
          render json: {
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: @template.errors.messages
            }
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/templates/:id
      def destroy
        @template.destroy
        head :no_content
      end

      # GET /api/v1/templates/:id/download?format=docx
      def download
        format = params[:format] || 'docx'

        case format
        when 'docx'
          if @template.file.attached?
            redirect_to rails_blob_url(@template.file, disposition: 'attachment'), allow_other_host: true
          else
            render json: {
              error: {
                message: 'No file attached to this template',
                code: 'FILE_NOT_FOUND'
              }
            }, status: :not_found
          end
        when 'pdf'
          if @template.pdf_file.attached?
            redirect_to rails_blob_url(@template.pdf_file, disposition: 'attachment'), allow_other_host: true
          else
            render json: {
              error: {
                message: 'PDF not generated yet. Please try again later.',
                code: 'PDF_NOT_FOUND'
              }
            }, status: :not_found
          end
        else
          render json: {
            error: {
              message: 'Invalid format. Supported formats: docx, pdf',
              code: 'INVALID_FORMAT'
            }
          }, status: :bad_request
        end
      end

      # POST /api/v1/templates/:id/parse
      def parse
        ParseTemplateJob.perform_later(@template.id)

        @template.update(status: 'parsing', started_at: Time.current)

        render json: {
          data: {
            id: @template.id,
            status: 'parsing'
          },
          meta: {
            message: 'Parsing initiated'
          }
        }, status: :accepted
      end

      # POST /api/v1/templates/:id/apply_job
      def apply_job
        job_description = current_user.job_descriptions.find(params[:job_id])

        unless job_description.completed?
          return render json: {
            error: {
              message: 'Job description must be completed before applying to template',
              code: 'JOB_NOT_READY'
            }
          }, status: :unprocessable_entity
        end

        unless @template.file.attached?
          return render json: {
            error: {
              message: 'Template must have a file attached',
              code: 'FILE_REQUIRED'
            }
          }, status: :unprocessable_entity
        end

        # Prepare options for token replacement
        options = {
          bold_tokens: boolean_param(:bold_tokens, default: true),
          highlight_skills: boolean_param(:highlight_skills, default: false),
          skills_list: extract_skills_list(job_description)
        }

        # Apply job description values to template tokens
        result = DocxTemplateService.new(@template, job_description).apply_tokens(
          params[:token_mappings] || {},
          options
        )

        if result[:success]
          render json: {
            data: {
              id: @template.id,
              # Use backend host so OnlyOffice can download the processed document
              download_url: rails_blob_url(
                @template.file,
                host: ENV.fetch('BACKEND_HOST', 'http://backend:3000'),
                disposition: 'inline'
              )
            },
            meta: {
              message: 'Tokens applied successfully. Download the updated template.'
            }
          }
        else
          render json: {
            error: {
              message: result[:error],
              code: 'TOKEN_APPLICATION_FAILED'
            }
          }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: {
            message: 'Job description not found',
            code: 'NOT_FOUND'
          }
        }, status: :not_found
      end

      # GET /api/v1/templates/:id/editor_config
      def editor_config
        config = OnlyofficeService.generate_document_config(@template, current_user, mode: 'edit')

        render json: {
          data: {
            config: config,
            # Use public-facing OnlyOffice URL for browser to load the API script
            onlyoffice_url: ENV.fetch('ONLYOFFICE_PUBLIC_URL', 'http://localhost:8080')
          }
        }
      end

      # POST /api/v1/templates/:id/onlyoffice_callback
      def onlyoffice_callback
        # Find template without authentication (OnlyOffice doesn't send auth token)
        template = Template.find(params[:id])
        callback_data = JSON.parse(request.body.read)

        result = OnlyofficeService.handle_callback(template, callback_data)

        render json: result
      rescue StandardError => e
        Rails.logger.error("OnlyOffice callback error: #{e.message}")
        render json: { error: 1, message: e.message }
      end

      # POST /api/v1/templates/:id/export_pdf
      def export_pdf
        unless @template.file.attached?
          return render json: {
            error: {
              message: 'Template must have a file attached',
              code: 'FILE_REQUIRED'
            }
          }, status: :unprocessable_entity
        end

        result = PdfConversionService.convert_to_pdf(@template)

        if result[:success]
          render json: {
            data: {
              id: @template.id,
              pdf_url: result[:pdf_url]
            },
            meta: {
              message: 'PDF generated successfully'
            }
          }
        else
          render json: {
            error: {
              message: result[:error] || 'PDF conversion failed',
              code: 'PDF_CONVERSION_FAILED'
            }
          }, status: :unprocessable_entity
        end
      end

      private

      def set_template
        @template = current_user.templates.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: {
          error: {
            message: 'Template not found',
            code: 'NOT_FOUND'
          }
        }, status: :not_found
      end

      def template_params
        params.require(:template).permit(:name, :content_text, :file)
      end

      def extract_skills_list(job_description)
        skills = []

        # Extract from top_5_skills_needed
        top_skills = job_description.parsed_attributes&.dig('top_5_skills_needed')
        skills.concat(top_skills) if top_skills.is_a?(Array)

        # Extract from skills_required
        skills_required = job_description.parsed_attributes&.dig('skills_required')
        if skills_required.is_a?(Array)
          skills_required.each do |skill|
            if skill.is_a?(Hash)
              skills << (skill['name'] || skill[:name])
            else
              skills << skill.to_s
            end
          end
        end

        skills.compact.uniq
      end

      def template_update_params
        params.require(:template).permit(:name)
      end

      def filter_by_status(scope)
        return scope unless params[:status].present?

        scope.where(status: params[:status])
      end

      def template_response(template, include_raw: false)
        response = {
          id: template.id,
          name: template.name,
          status: template.status,
          file: template.file_info,
          pdf: template.pdf_info,
          content_text: template.content_text,
          parsed_attributes: template.parsed_attributes,
          error_message: template.error_message,
          attempt_count: template.attempt_count,
          started_at: template.started_at,
          completed_at: template.completed_at,
          created_at: template.created_at,
          updated_at: template.updated_at
        }

        response[:raw_llm_response] = template.raw_llm_response if include_raw

        response
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          per_page: collection.limit_value,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          next_page: collection.next_page,
          prev_page: collection.prev_page
        }
      end
    end
  end
end
