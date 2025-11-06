class ApplicationController < ActionController::API
  # Basic error handling
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity

  private

  # Casts a boolean-like param to true/false using Rails' boolean caster.
  # Returns the provided default if the param is not present.
  def boolean_param(key, default: nil)
    return default if params[key].nil?
    ActiveModel::Type::Boolean.new.cast(params[key])
  end

  def not_found
    render json: { error: { message: 'Resource not found', code: 'NOT_FOUND' } },
           status: :not_found
  end

  def unprocessable_entity(exception)
    render json: {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: exception.record.errors.messages
      }
    }, status: :unprocessable_entity
  end
end
