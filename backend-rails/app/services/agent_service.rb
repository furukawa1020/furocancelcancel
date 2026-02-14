class AgentService
  include Singleton

  attr_accessor :is_summoning, :current_shame_message, :current_summon_message, :current_anger

  def initialize
    @is_summoning = false
    @current_shame_message = "I am ignoring my bath to play on my phone. #IntentlessBath"
    @current_summon_message = "It is time. The water calls."
    @current_anger = 0.0 # New
    @check_interval = 60 # seconds
    @thread = nil
  end

  def start
    return if @thread&.alive?
    puts "[Agent] The Tyrant is watching..."
    @thread = Thread.new do
      loop do
        tick
        sleep @check_interval
      end
    end
  end

  def stop
    @thread&.kill
  end

  def stop_summon
    if @is_summoning
      puts "[Agent] Summon stopped by User Action (NFC)."
      @is_summoning = false
    end
  end

  def manual_summon
    puts "[Agent] Manual Summon Triggered."
    @is_summoning = true
    # Auto-stop logic in a separate thread/timer if needed
    Thread.new do
      sleep(5 * 60)
      if @is_summoning
        puts "[Agent] Giving up manually after 5 mins."
        @is_summoning = false
      end
    end
  end

  def tick
    return if @is_summoning

    now = Time.now
    hour = now.hour

    # === THE AI BRAIN ===
    # Gather Context
    temp = WeatherService.get_current_temperature
    user = User.first # In production, this would be context-specific
    streak = user&.bandit_stat&.current_streak || 0
    last_bath = user&.bandit_stat&.last_bath_at
    last_bath_hours_ago = last_bath ? ((now - last_bath) / 3600.0) : 999

    context = {
      hour: hour,
      temp: temp,
      streak: streak,
      last_bath_hours_ago: last_bath_hours_ago
    }

    # Calculate Emotional State
    emotions = UtilityCalculator.calculate(context)
    @current_anger = emotions[:anger] # Store it
    
    puts "[Agent] Tick #{hour}:00 | Anger: #{emotions[:anger].round(2)}, Urgency: #{emotions[:urgency].round(2)}, Mercy: #{emotions[:mercy].round(2)}"

    # Decision: Should we summon?
    # Use Anger as threshold (with randomness for unpredictability)
    roll = rand
    threshold = emotions[:anger] * 0.9 # Slightly reduce to avoid constant summoning
    should_summon = roll < threshold && hour >= 18

    if should_summon
      puts "[Agent] DECISION: SUMMON USER. (Roll: #{roll.round(2)} < Threshold: #{threshold.round(2)})"
      @is_summoning = true
      
      # Generate AI Messages
      # Generate AI Messages
      @current_summon_message = DialogueGenerator.generate(emotions, context)
      @current_shame_message = DialogueGenerator.generate_shame(emotions, context)
      
      puts "[Agent] Message: \"#{@current_summon_message}\""
      
      # Store for API (we could add a field for this)
      # For now, shame_message is what mobile polls
    else
      puts "[Agent] No summon. (Roll: #{roll.round(2)} >= Threshold: #{threshold.round(2)})"
    end
  rescue => e
    puts "[Agent] Error in tick: #{e.message}"
    puts e.backtrace.first(5).join("\n")
  end
end
