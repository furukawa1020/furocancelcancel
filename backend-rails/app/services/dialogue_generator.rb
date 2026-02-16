# DialogueGenerator: Procedural Dialogue Engine
# Generates context-aware messages based on emotional state
class DialogueGenerator
  GREETINGS = {
    low: ["Hey.", "Listen.", "Excuse me."],
    med: ["Look here.", "Pay attention.", "Seriously."],
    high: ["LISTEN TO ME.", "STOP.", "ENOUGH."]
  }

  OBSERVATIONS = {
    time_late: ->(c) { ["It's #{c[:hour]}:00.", "The time is #{c[:hour]}:00.", "It is now #{c[:hour]} o'clock."].sample },
    time_critical: ->(c) { ["It's past #{c[:hour]}:00.", "It's almost midnight.", "The day is ending."].sample },
    cold: ->(c) { ["It's #{c[:temp]}°C outside.", "It's freezing (#{c[:temp]}°C).", "The temperature is #{c[:temp]} degrees."].sample },
    hot: ->(c) { ["It's #{c[:temp]}°C.", "It's sweltering outside.", "The heat is #{c[:temp]} degrees."].sample },
    streak: ->(c) { ["You have a #{c[:streak]}-day streak.", "#{c[:streak]} consecutive days.", "#{c[:streak]} days in a row."].sample }
  }

  COMMANDS = {
    soft: ["Please consider taking your bath.", "It might be time.", "You should go.", "I am waiting for you."],
    firm: ["Get in the bath.", "Take your bath now.", "Go to the bathroom.", "Do not make me wait."],
    harsh: ["GET. IN. THE. BATH.", "MOVE. NOW.", "GO. IMMEDIATELY.", "I AM WATCHING YOU."]
  }

  THREATS = {
    none: ["", "Thank you.", "I appreciate it."],
    mild: ["Or I'll keep reminding you.", "I won't stop.", "This will continue.", "I never sleep."],
    nuclear: ["Or I'm tweeting this.", "Or the world finds out.", "Or I execute the Social Guillotine.", "There is no escape."]
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
      obs << OBSERVATIONS[:time_critical].call(context)
    elsif context[:hour] >= 20
      obs << OBSERVATIONS[:time_late].call(context)
    end

    # Weather
    if context[:temp]
      if context[:temp] < 10
        obs << OBSERVATIONS[:cold].call(context)
      elsif context[:temp] > 30
        obs << OBSERVATIONS[:hot].call(context)
      end
    end

    # Streak (only if significant)
    if context[:streak] && context[:streak] >= 3 && emotions[:disappointment] > 0.5
      obs << OBSERVATIONS[:streak].call(context)
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
