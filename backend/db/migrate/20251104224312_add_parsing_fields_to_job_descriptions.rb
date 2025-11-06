class AddParsingFieldsToJobDescriptions < ActiveRecord::Migration[8.0]
  def change
    add_column :job_descriptions, :raw_llm_response, :jsonb
    add_column :job_descriptions, :attempt_count, :integer, default: 0
    add_column :job_descriptions, :started_at, :datetime
    add_column :job_descriptions, :completed_at, :datetime
  end
end
