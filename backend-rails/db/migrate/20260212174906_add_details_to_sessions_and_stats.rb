class AddDetailsToSessionsAndStats < ActiveRecord::Migration[7.1]
  def change
    add_column :sessions, :tau_limit, :integer
    add_column :bandit_stats, :tau_mu, :integer
  end
end
