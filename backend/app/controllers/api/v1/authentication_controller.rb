module Api
  module V1
    class AuthenticationController < ApplicationController
      # POST /api/v1/auth/register
      def register
        user = User.new(user_params)

        if user.save
          # Generate and send OTP instead of returning token immediately
          otp = user.generate_otp!
          UserMailer.verify_email(user, otp).deliver_later

          verification_url = "#{ENV.fetch('FRONTEND_URL', 'http://localhost:5173')}/verify-email?email=#{CGI.escape(user.email)}&code=#{CGI.escape(otp)}"

          render json: {
            data: {
              message: 'Registration successful. Please check your email for verification code.',
              email: user.email,
              requires_verification: true,
              verification_url: verification_url
            }
          }, status: :created
        else
          render json: {
            error: {
              message: 'Registration failed',
              code: 'VALIDATION_ERROR',
              details: user.errors.messages
            }
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/login
      def login
        # Guard against nil params
        unless params[:user].present?
          return render json: {
            error: {
              message: 'Missing user parameters',
              code: 'BAD_REQUEST'
            }
          }, status: :bad_request
        end

        user = User.find_by(email: params[:user][:email])

        if user&.valid_password?(params[:user][:password])
          # Check if email is confirmed
          unless user.email_confirmed?
            return render json: {
              error: {
                message: 'Please verify your email address before logging in',
                code: 'EMAIL_NOT_VERIFIED',
                email: user.email
              }
            }, status: :forbidden
          end

          token = generate_jwt(user)
          render json: {
            data: {
              user: user_response(user),
              token: token
            }
          }, status: :ok
        else
          render json: {
            error: {
              message: 'Invalid email or password',
              code: 'UNAUTHORIZED'
            }
          }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/verify_otp
      def verify_otp
        unless params[:user].present?
          return render json: {
            error: {
              message: 'Missing user parameters',
              code: 'BAD_REQUEST'
            }
          }, status: :bad_request
        end

        user = User.find_by(email: params[:user][:email])

        unless user
          return render json: {
            error: {
              message: 'User not found',
              code: 'NOT_FOUND'
            }
          }, status: :not_found
        end

        if user.email_confirmed?
          return render json: {
            error: {
              message: 'Email already verified',
              code: 'ALREADY_VERIFIED'
            }
          }, status: :unprocessable_entity
        end

        if user.valid_otp?(params[:user][:otp])
          user.confirm_email!
          token = generate_jwt(user)

          render json: {
            data: {
              message: 'Email verified successfully',
              user: user_response(user),
              token: token
            }
          }, status: :ok
        else
          render json: {
            error: {
              message: 'Invalid or expired verification code',
              code: 'INVALID_OTP'
            }
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/resend_otp
      def resend_otp
        unless params[:user].present?
          return render json: {
            error: {
              message: 'Missing user parameters',
              code: 'BAD_REQUEST'
            }
          }, status: :bad_request
        end

        user = User.find_by(email: params[:user][:email])

        unless user
          return render json: {
            error: {
              message: 'User not found',
              code: 'NOT_FOUND'
            }
          }, status: :not_found
        end

        if user.email_confirmed?
          return render json: {
            error: {
              message: 'Email already verified',
              code: 'ALREADY_VERIFIED'
            }
          }, status: :unprocessable_entity
        end

        # Generate and send new OTP
        otp = user.generate_otp!
        UserMailer.verify_email(user, otp).deliver_later

        render json: {
          data: {
            message: 'Verification code resent successfully',
            email: user.email
          }
        }, status: :ok
      end

      # DELETE /api/v1/auth/logout
      def logout
        # JWT tokens are stateless, so logout is handled client-side by removing the token
        # In the future, we could implement a token blacklist
        render json: { message: 'Logged out successfully' }, status: :ok
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end

      def generate_jwt(user)
        payload = {
          sub: user.id,
          email: user.email,
          exp: 1.hour.from_now.to_i
        }
        JWT.encode(payload, ENV['JWT_SECRET_KEY'], 'HS256')
      end

      def user_response(user)
        {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      end
    end
  end
end
