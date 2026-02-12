class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :device_id
      t.string :current_tier
      t.boolean :has_sessions

      t.timestamps
    end
    add_index :users, :device_id
  end
end
