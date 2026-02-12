class CreateRecipes < ActiveRecord::Migration[7.1]
  def change
    create_table :recipes do |t|
      t.string :tier
      t.string :title
      t.text :steps_json
      t.integer :base_duration_sec

      t.timestamps
    end
  end
end
