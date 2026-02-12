class AddDetailsToSessionsAndStats < ActiveRecord::Migration[7.1]
  def change
    add_column :sessions_and_stats, :tau_limit, :integer
    add_column :sessions_and_stats, :tau_mu, :integer
  end
end
