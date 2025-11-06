module Api
  module V1
    class UsersController < BaseController
      # GET /api/v1/users/me
      def me
        render json: {
          data: {
            id: current_user.id,
            email: current_user.email,
            created_at: current_user.created_at
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

      private

      def user_update_params
        params.require(:user).permit(:email)
      end
    end
  end
end
