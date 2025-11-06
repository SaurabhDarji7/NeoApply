class CreateTemplates < ActiveRecord::Migration[8.0]
  def change
    create_table :templates do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.text :content_text
      t.string :status, null: false, default: 'pending'
      t.jsonb :parsed_attributes
      t.jsonb :raw_llm_response
      t.text :error_message
      t.integer :attempt_count, default: 0
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :templates, :status
    add_index :templates, :parsed_attributes, using: :gin
  end
end
