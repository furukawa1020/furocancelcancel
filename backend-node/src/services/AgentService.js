const WeatherService = require('./WeatherService');

class AgentService {
    constructor() {
        this.isSummoning = false;
        this.timer = null;
        this.checkInterval = 60 * 1000; // Check every 1 minute
    }

    start() {
        console.log("[Agent] The Tyrant is watching...");
        // Start the loop
        this.timer = setInterval(() => this.tick(), this.checkInterval);
    }

    stop() {
        if (this.timer) clearInterval(this.timer);
    }

    stopSummon() {
        if (this.isSummoning) {
            console.log("[Agent] Summon stopped by User Action (NFC).");
            this.isSummoning = false;
        }
    }

    manualSummon() {
        console.log("[Agent] Manual Summon Triggered.");
        this.isSummoning = true;
        // Auto-stop after 5 mins if ignored? Or be relentless? 
        // For now, let's keep the manual summon relentless until checked or 5 mins.
        setTimeout(() => {
            if (this.isSummoning) {
                console.log("[Agent] Giving up manually after 5 mins.");
                this.isSummoning = false;
            }
        }, 5 * 60 * 1000);
    }

    async tick() {
        if (this.isSummoning) return; // Already screaming

        const now = new Date();
        const hour = now.getHours();

        // 1. Base Probability by Hour (The Tyrant's Schedule)
        let prob = 0.0;

        if (hour < 18) {
            prob = 0.0; // Day time: Peace
        } else if (hour < 20) {
            prob = 0.05; // 18:00-20:00: 5% / min (Very low, ~25% chance in 2 hours)
        } else if (hour < 22) {
            prob = 0.15; // 20:00-22:00: 15% / min (High, ~60% chance/hour)
        } else if (hour < 24) {
            prob = 0.40; // 22:00-00:00: 40% / min (Very High)
        } else {
            prob = 1.0;  // 00:00+: 100% (IMMEDIATE)
        }

        // 2. Weather Multiplier
        try {
            const temp = await WeatherService.getCurrentTemperature();
            if (temp !== null && temp < 10) {
                prob = prob * 1.5; // Cold? Get in now.
                console.log(`[Agent] It's cold (${temp}C). Patience reduced.`);
            }
        } catch (e) {
            // Ignore weather error
        }

        // 3. Roll the Dice
        const roll = Math.random();
        const shouldSummon = roll < prob;

        console.log(`[Agent] Tick ${hour}:00. Roll: ${roll.toFixed(2)} < Prob: ${prob.toFixed(2)} ? ${shouldSummon}`);

        if (shouldSummon) {
            console.log("[Agent] DECISION: SUMMON USER NOW.");
            this.isSummoning = true;
        }
    }
}

module.exports = new AgentService();
