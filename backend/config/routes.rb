Rails.application.routes.draw do
  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check

  # API routes
  namespace :api do
    namespace :v1 do
      # Authentication routes
      post 'auth/register', to: 'authentication#register'
      post 'auth/login', to: 'authentication#login'
      delete 'auth/logout', to: 'authentication#logout'
      post 'auth/verify_otp', to: 'authentication#verify_otp'
      post 'auth/resend_otp', to: 'authentication#resend_otp'

      # User routes
      get 'users/me', to: 'users#me'
      put 'users/me', to: 'users#update'

      # Resume routes
      resources :resumes, only: [:index, :show, :create, :destroy] do
        member do
          get :status
          get :download
        end
      end

      # Job description routes
      resources :job_descriptions, only: [:index, :show, :create, :destroy] do
        member do
          get :status
          post :parse
        end
      end

      # Template routes
      resources :templates, only: [:index, :show, :create, :update, :destroy] do
        member do
          get :download
          post :parse
          post :apply_job
          get :editor_config
          post :onlyoffice_callback
          post :export_pdf
        end
      end

      # Chrome Extension routes
      namespace :extension do
        # Autofill profile
        resource :autofill_profile, only: [:show, :update]

        # Application tracking
        resources :applications, only: [:index, :show, :create, :update, :destroy]

        # AI-generated answers
        namespace :answers do
          post :generate
        end
      end
    end
  end
end
