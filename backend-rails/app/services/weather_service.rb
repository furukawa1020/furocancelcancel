require 'net/http'
require 'json'

class WeatherService
  # Kanazawa Coordinates or approximate default
  LAT = 36.56
  LON = 136.66

  def self.get_current_temperature
    url = URI("https://api.open-meteo.com/v1/forecast?latitude=#{LAT}&longitude=#{LON}&current_weather=true")
    
    begin
      response = Net::HTTP.get(url)
      data = JSON.parse(response)
      
      if data && data['current_weather']
        return data['current_weather']['temperature']
      end
    rescue => e
      puts "[Weather] Error: #{e.message}"
    end
    
    nil
  end
end
