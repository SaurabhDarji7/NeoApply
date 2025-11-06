# frozen_string_literal: true

class CreateJobDescriptions < ActiveRecord::Migration[8.0]
  def change
    create_table :job_descriptions do |t|
      t.references :user, null: false, foreign_key: true
      t.text :url
      t.string :title
      t.string :company_name
      t.text :raw_text
      t.jsonb :parsed_attributes, default: {}
      t.string :status, default: 'pending'
      t.text :error_message

      t.timestamps
    end

    add_index :job_descriptions, :status
  end
end
