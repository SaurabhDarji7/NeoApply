# frozen_string_literal: true

module Api
  module V1
    module Extension
      class AutofillProfilesController < ApplicationController
        before_action :authenticate_user!

        # GET /api/v1/extension/autofill_profile
        def show
          profile = current_user.autofill_profile || current_user.build_autofill_profile(
            email: current_user.email
          )

          render json: {
            profile: profile_json(profile)
          }
        end

        # PUT /api/v1/extension/autofill_profile
        def update
          profile = current_user.autofill_profile || current_user.build_autofill_profile

          if profile.update(profile_params)
            render json: {
              profile: profile_json(profile),
              message: 'Profile updated successfully'
            }
          else
            render json: {
              error: 'Failed to update profile',
              errors: profile.errors.full_messages
            }, status: :unprocessable_entity
          end
        end

        private

        def profile_params
          params.require(:profile).permit(
            :first_name, :last_name, :email, :phone,
            :address, :city, :state, :zip, :country,
            :linkedin, :github, :portfolio
          )
        end

        def profile_json(profile)
          {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            city: profile.city,
            state: profile.state,
            zip: profile.zip,
            country: profile.country,
            linkedin: profile.linkedin,
            github: profile.github,
            portfolio: profile.portfolio
          }
        end
      end
    end
  end
end
