module Api
  module V1
    class BaseController < ApplicationController
      before_action :authenticate_user!

      private

      def authenticate_user!
        header = request.headers['Authorization']

        # Validate Bearer token format
        unless header&.start_with?('Bearer ')
          return render json: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, status: :unauthorized
        end

        token = header.split(' ', 2).last

        begin
          @decoded = JWT.decode(
            token,
            ENV['JWT_SECRET_KEY'],
            true,
            algorithm: 'HS256',
            verify_expiration: true
          )
          @current_user = User.find(@decoded[0]['sub'])
        rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound, TypeError
          render json: { error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }, status: :unauthorized
        end
      end

      def current_user
        @current_user
      end
    end
  end
end
