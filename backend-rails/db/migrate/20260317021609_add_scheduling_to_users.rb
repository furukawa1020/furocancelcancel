class AddSchedulingToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :start_hour, :integer
    add_column :users, :curfew_hour, :integer
  end
end
