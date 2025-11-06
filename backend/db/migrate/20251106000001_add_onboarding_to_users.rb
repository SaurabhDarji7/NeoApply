class AddOnboardingToUsers < ActiveRecord::Migration[8.0]
  def up
    add_column :users, :onboarding_completed_at, :datetime
    add_column :users, :onboarding_current_step, :integer, default: 1
    add_column :users, :has_uploaded_resume, :boolean, default: false

    add_index :users, :onboarding_completed_at
  end

  def down
    remove_index :users, :onboarding_completed_at
    remove_column :users, :has_uploaded_resume
    remove_column :users, :onboarding_current_step
    remove_column :users, :onboarding_completed_at
  end
end
