# frozen_string_literal: true

class CreateResumes < ActiveRecord::Migration[8.0]
  def change
    create_table :resumes do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.jsonb :parsed_data
      t.string :status, null: false, default: 'pending'
      t.text :error_message

      t.timestamps
    end

    add_index :resumes, :status
    add_index :resumes, :parsed_data, using: :gin
  end
end
