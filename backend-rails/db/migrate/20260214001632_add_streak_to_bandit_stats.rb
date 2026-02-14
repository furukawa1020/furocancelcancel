class AddStreakToBanditStats < ActiveRecord::Migration[7.1]
  def change
    add_column :bandit_stats, :current_streak, :integer
    add_column :bandit_stats, :last_bath_at, :datetime
  end
end
