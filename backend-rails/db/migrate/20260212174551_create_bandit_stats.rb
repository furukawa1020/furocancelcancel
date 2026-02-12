class CreateBanditStats < ActiveRecord::Migration[7.1]
  def change
    create_table :bandit_stats do |t|
      t.references :user, null: false, foreign_key: true
      t.string :context
      t.string :arm
      t.integer :alpha
      t.integer :beta

      t.timestamps
    end
  end
end
