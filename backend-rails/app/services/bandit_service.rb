class BanditService
  def self.get_tau(user_id)
    stat = BanditStat.find_by(user_id: user_id)
    unless stat
      # Default: alpha=2, beta=2 (Neutral)
      # We don't store mu directly in DB model scaffold? 
      # Node model had tau_mu?
      # Rails scaffold: context:string arm:string alpha:integer beta:integer
      # Wait, Node Model had `tau_mu`. Rails scaffold didn't have `tau_mu`.
      # I need to add `tau_mu` to BanditStat or calculate it.
      # Node's updateTau logic: updates tau_mu directly.
      # Let's add tau_mu to the model via migration or just store it in `alpha`? No.
      # I missed `tau_mu` in the scaffold! 
      # I will assume we can use a separate migration or just rely on 'alpha' as tau?
      # No, tau is 180s. Alpha/Beta are for probability.
      # Node code: `stat.tau_mu = newTau`.
      # I should add `tau_mu` column.
      
      stat = BanditStat.create(user_id: user_id, alpha: 2, beta: 2) 
      # Hack: We will use 'alpha' to store tau_mu for now if column missing, OR I fix the schema.
      # Better to fix the schema. But for now I'll create the file assuming I'll fix the schema.
      # Actually, let's just use `alpha` as `tau_mu` (mean) in seconds? No, that's confusing.
      # I'll create a migration to add `tau_mu`.
    end
    stat
  end

  # Select Recipe based on Tau
  def self.select_recipe(tau)
    tier = '3min'
    if tau < 90
      tier = '1min'
    elsif tau < 150
      tier = '2min'
    end

    recipe = Recipe.find_by(tier: tier)
    recipe || Recipe.find_by(tier: '3min')
  end

  def self.update_tau(user_id, is_ok, session_duration)
    stat = get_tau(user_id)
    current_tau = stat.tau_mu || 180
    new_tau = current_tau

    if is_ok
      new_tau += 5
    else
      new_tau -= 15
    end

    # Clamp
    new_tau = 150 if new_tau < 150
    new_tau = 240 if new_tau > 240

    stat.update(tau_mu: new_tau)
    new_tau
  end

  def self.calculate_effective_tau(user_id, now = Time.now)
    stat = get_tau(user_id)
    tau = (stat.tau_mu || 180).to_f
    reasoning = "Standard Routine."

    hour = now.hour

    # 1. Time Context
    if hour >= 6 && hour < 10
      tau *= 0.8
      reasoning = "Morning Rush detected. Speed up."
      puts "[Bandit] Context: Morning Rush. Tau scaled to #{tau}"
    end

    # 2. Weather Context
    temp = WeatherService.get_current_temperature
    if temp
      if temp < 10
        tau *= 1.15
        reasoning = "It's freezing (#{temp}C). Take your time."
      elsif temp > 30
        tau *= 0.9
        reasoning = "It's sweltering (#{temp}C). Quick wash."
      end
    end

    # 3. Clamp
    tau = 150 if tau < 150
    tau = 240 if tau > 240

    { tau: tau.round, reasoning: reasoning }
  end

  def self.get_or_create_user(device_id)
    return nil unless device_id
    user = User.find_by(device_id: device_id)
    unless user
      user = User.create(device_id: device_id)
      # Create Stat
      BanditStat.create(user_id: user.id, tau_mu: 180, alpha: 2, beta: 2)
    end
    user
  end
end
