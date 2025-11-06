module Api
  module V1
    class UsersController < BaseController
      # GET /api/v1/users/me
      def me
        render json: {
          data: {
            id: current_user.id,
            email: current_user.email,
            created_at: current_user.created_at,
            onboarding_completed: current_user.onboarding_completed?,
            onboarding_current_step: current_user.onboarding_current_step,
            has_uploaded_resume: current_user.has_uploaded_resume?
          }
        }, status: :ok
      end

      # PUT /api/v1/users/me
      def update
        if current_user.update(user_update_params)
          render json: {
            data: {
              id: current_user.id,
              email: current_user.email,
              updated_at: current_user.updated_at
            }
          }, status: :ok
        else
          render json: {
            error: {
              message: 'Update failed',
              code: 'VALIDATION_ERROR',
              details: current_user.errors.messages
            }
          }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/users/onboarding/step
      def update_onboarding_step
        step = params[:step].to_i

        if step.between?(1, 4)
          current_user.update_onboarding_step!(step)
          render json: {
            data: {
              onboarding_current_step: current_user.onboarding_current_step
            }
          }, status: :ok
        else
          render json: {
            error: {
              message: 'Invalid step number',
              code: 'INVALID_STEP'
            }
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/users/onboarding/complete
      def complete_onboarding
        current_user.complete_onboarding!
        render json: {
          data: {
            onboarding_completed: true,
            onboarding_completed_at: current_user.onboarding_completed_at
          }
        }, status: :ok
      end

      private

      def user_update_params
        params.require(:user).permit(:email)
      end
    end
  end
end
