class CreateSessions < ActiveRecord::Migration[7.1]
  def change
    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :status
      t.datetime :started_at
      t.datetime :ends_at
      t.datetime :finished_at
      t.string :proof_type
      t.string :feedback
      t.integer :recipe_id

      t.timestamps
    end
  end
end
