# DialogueGenerator: Procedural Dialogue Engine
# Generates context-aware messages based on emotional state
class DialogueGenerator
  GREETINGS = {
    low: ["Hey.", "Listen.", "Excuse me."],
    med: ["Look here.", "Pay attention.", "Seriously."],
    high: ["LISTEN TO ME.", "STOP.", "ENOUGH."]
  }

  OBSERVATIONS = {
    time_late: ["It's #{hour}:00.", "The time is #{hour}:00.", "It is now #{hour} o'clock."],
    time_critical: ["It's past #{hour}:00.", "It's almost midnight.", "The day is ending."],
    cold: ["It's #{temp}°C outside.", "It's freezing (#{temp}°C).", "The temperature is #{temp} degrees."],
    hot: ["It's #{temp}°C.", "It's sweltering outside.", "The heat is #{temp} degrees."],
    streak: ["You have a #{streak}-day streak.", "#{streak} consecutive days.", "#{streak} days in a row."]
  }

  COMMANDS = {
    soft: ["Please consider taking your bath.", "It might be time.", "You should go."],
    firm: ["Get in the bath.", "Take your bath now.", "Go to the bathroom."],
    harsh: ["GET. IN. THE. BATH.", "MOVE. NOW.", "GO. IMMEDIATELY."]
  }

  THREATS = {
    none: ["", "Thank you.", "I appreciate it."],
    mild: ["Or I'll keep reminding you.", "I won't stop.", "This will continue."],
    nuclear: ["Or I'm tweeting this.", "Or the world finds out.", "Or I execute the Social Guillotine."]
  }

  def self.generate(emotions, context)
    level = emotion_level(emotions[:anger])
    
    greeting = GREETINGS[level].sample
    observations = build_observations(emotions, context, level)
    command = COMMANDS[command_level(emotions[:anger])].sample
    threat = THREATS[threat_level(emotions[:anger])].sample

    # Assemble
    parts = [greeting, observations, command, threat].compact.reject(&:empty?)
    
    # Template interpolation
    message = parts.join(" ")
    interpolate(message, context)
  end

  def self.generate_shame(emotions, context)
    if emotions[:disappointment] > 0.7
      "I had a #{context[:streak]}-day streak and chose to break it for my phone. #IntentlessBath"
    elsif context[:temp] && context[:temp] < 10
      "It is freezing (#{context[:temp]}°C) and I refuse to warm up. I choose to suffer. #IntentlessBath"
    elsif context[:hour] >= 23
      "It is past 11PM and I am doomscrolling instead of bathing. Help me. #IntentlessBath"
    else
      "I am ignoring my bath to play on my phone. Someone scold me. #IntentlessBath"
    end
  end

  private

  def self.emotion_level(anger)
    return :high if anger > 0.7
    return :med if anger > 0.4
    :low
  end

  def self.command_level(anger)
    return :harsh if anger > 0.8
    return :firm if anger > 0.5
    :soft
  end

  def self.threat_level(anger)
    return :nuclear if anger > 0.85
    return :mild if anger > 0.6
    :none
  end

  def self.build_observations(emotions, context, level)
    obs = []
    
    # Time observation
    if context[:hour] >= 23
      obs << OBSERVATIONS[:time_critical].sample
    elsif context[:hour] >= 20
      obs << OBSERVATIONS[:time_late].sample
    end

    # Weather
    if context[:temp]
      if context[:temp] < 10
        obs << OBSERVATIONS[:cold].sample
      elsif context[:temp] > 30
        obs << OBSERVATIONS[:hot].sample
      end
    end

    # Streak (only if significant)
    if context[:streak] && context[:streak] >= 3 && emotions[:disappointment] > 0.5
      obs << OBSERVATIONS[:streak].sample
    end

    obs.join(" ")
  end

  def self.interpolate(text, context)
    text.gsub(/\#\{(\w+)\}/) do |match|
      key = $1.to_sym
      context[key] || match
    end
  end
end
