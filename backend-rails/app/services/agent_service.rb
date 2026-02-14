class AgentService
  include Singleton

  attr_accessor :is_summoning, :current_shame_message

  def initialize
    @is_summoning = false
    @current_shame_message = "I am ignoring my bath to play on my phone. #IntentlessBath"
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
    prob = 0.0

    if hour < 18
      prob = 0.0
    elsif hour < 20
      prob = 0.05
    elsif hour < 22
      prob = 0.15
    elsif hour < 24
      prob = 0.40
    else
      prob = 1.0
    end

    # Weather Multiplier
    temp = WeatherService.get_current_temperature
    if temp
      if temp < 10
        prob *= 2.0
        puts "[Agent] Cold boost."
      elsif temp > 30
        prob *= 1.5
        puts "[Agent] Hot boost."
      end
    end

    roll = rand
    should_summon = roll < prob
    
    puts "[Agent] Tick #{hour}:00. Roll: #{roll.round(2)} < Prob: #{prob.round(2)} ? #{should_summon}"

    if should_summon
      puts "[Agent] DECISION: SUMMON USER NOW."
      @is_summoning = true
      
      # Generate Dynamic Shame
      if temp && temp < 10
        @current_shame_message = "It is freezing (#{temp}C) and I refuse to warm up. I choose to suffer. #IntentlessBath"
      elsif hour >= 23
        @current_shame_message = "It is past 11PM and I am doomscrolling instead of bathing. Help me. #IntentlessBath"
      else
        @current_shame_message = "I am ignoring the Tyrant. My hygiene is optional. #IntentlessBath"
      end
    end
  rescue => e
    puts "[Agent] Error in tick: #{e.message}"
  end
end
