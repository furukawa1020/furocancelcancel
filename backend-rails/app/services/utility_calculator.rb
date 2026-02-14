# UtilityCalculator: The "Emotional Core" of the AI
# Calculates Anger, Urgency, Mercy based on Context
class UtilityCalculator
  def self.calculate(context)
    hour = context[:hour]
    temp = context[:temp]
    streak = context[:streak]
    last_bath_hours_ago = context[:last_bath_hours_ago] || 999

    # 1. Urgency (Time-based exponential)
    urgency = calculate_urgency(hour)

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

  def self.calculate_urgency(hour)
    # Before 18:00 -> 0
    # 18:00-22:00 -> Linear 0 to 0.5
    # 22:00-24:00 -> Exponential 0.5 to 1.0
    return 0.0 if hour < 18
    return ((hour - 18) / 4.0) * 0.5 if hour < 22
    
    # Exponential after 22:00
    excess = hour - 22
    0.5 + (excess / 2.0) ** 1.5 * 0.5
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
