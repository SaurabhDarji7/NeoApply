class CreateAutofillProfiles < ActiveRecord::Migration[8.0]
  def change
    create_table :autofill_profiles do |t|
      t.references :user, null: false, foreign_key: true
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :phone
      t.string :address
      t.string :city
      t.string :state
      t.string :zip
      t.string :country
      t.string :linkedin
      t.string :github
      t.string :portfolio

      t.timestamps
    end
  end
end
