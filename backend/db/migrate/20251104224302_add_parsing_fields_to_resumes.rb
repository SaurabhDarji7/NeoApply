class AddParsingFieldsToResumes < ActiveRecord::Migration[8.0]
  def change
    add_column :resumes, :raw_llm_response, :jsonb
    add_column :resumes, :attempt_count, :integer, default: 0
    add_column :resumes, :started_at, :datetime
    add_column :resumes, :completed_at, :datetime
    add_column :resumes, :content_text, :text
  end
end
