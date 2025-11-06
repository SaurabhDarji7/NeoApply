class CreateApplications < ActiveRecord::Migration[8.0]
  def change
    create_table :applications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :resume, null: false, foreign_key: true
      t.string :company
      t.string :role
      t.string :url
      t.string :ats_type
      t.string :status
      t.datetime :applied_at
      t.string :source
      t.text :notes

      t.timestamps
    end
  end
end
