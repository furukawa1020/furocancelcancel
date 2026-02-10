class WeatherService {
    static async getCurrentTemperature(latitude = 35.6895, longitude = 139.6917) {
        try {
            // Tokyo Coordinates by default
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn("[Weather] API Error:", response.statusText);
                return null;
            }

            const data = await response.json();
            return data.current_weather ? data.current_weather.temperature : null;
        } catch (e) {
            console.warn("[Weather] Fetch failed:", e.message);
            return null;
        }
    }
}

module.exports = WeatherService;
