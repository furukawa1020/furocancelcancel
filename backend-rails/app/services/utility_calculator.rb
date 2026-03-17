# UtilityCalculator: The "Emotional Core" of the AI
# Calculates Anger, Urgency, Mercy based on Context
class UtilityCalculator
  def self.calculate(context)
    hour = context[:hour]
    temp = context[:temp]
    streak = context[:streak]
    last_bath_hours_ago = context[:last_bath_hours_ago] || 999

    # 1. Urgency (Time-based exponential)
    urgency = calculate_urgency(hour, start_hour: context[:start_hour], curfew_hour: context[:curfew_hour])

    # 2. Disappointment (Streak-based)
    disappointment = calculate_disappointment(streak, last_bath_hours_ago)

    # 3. Mercy (Weather-based, inverted)
    mercy = calculate_mercy(temp)

    # 4. Anger (Composite)
    anger = (urgency * 0.5 + disappointment * 0.3 + (1.0 - mercy) * 0.2).clamp(0.0, 1.0)

    {
      urgency: urgency,
      disappointment: disappointment,
      mercy: mercy,
      anger: anger
    }
  end

  private

  def self.calculate_urgency(hour, start_hour: 18, curfew_hour: 23)
    # Use user-defined start_hour and curfew_hour
    start_hour ||= 18
    curfew_hour ||= 23

    return 0.0 if hour < start_hour
    
    if hour < curfew_hour
      # Linear increase from start to curfew (up to 0.7)
      range = curfew_hour - start_hour
      progress = (hour - start_hour).to_f / range
      progress * 0.7
    else
      # Exponential after curfew (0.7 to 1.0)
      excess = hour - curfew_hour
      0.7 + (excess / 2.0) ** 1.5 * 0.3
    end
  end

  def self.calculate_disappointment(streak, hours_ago)
    # High streak + Long delay = Max disappointment
    streak_factor = (streak || 0) / 10.0 # 10-day streak = 1.0
    delay_factor = [hours_ago / 48.0, 1.0].min # 48h = max

    (streak_factor * 0.6 + delay_factor * 0.4).clamp(0.0, 1.0)
  end

  def self.calculate_mercy(temp)
    # Very cold or very hot -> More mercy initially
    return 0.0 if temp.nil?
    
    if temp < 5
      0.8 # Freezing -> High mercy
    elsif temp < 15
      0.5 # Cold -> Some mercy
    elsif temp > 35
      0.6 # Sweltering -> Some mercy
    else
      0.2 # Normal -> Low mercy
    end
  end
end
