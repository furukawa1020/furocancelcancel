const { User, BanditStat, Recipe } = require('../models');

const WeatherService = require('./WeatherService');

class BanditService {
    // Get current Tau estimate for User
    static async getTau(userId) {
        let stat = await BanditStat.findOne({ where: { UserId: userId } });
        if (!stat) {
            stat = await BanditStat.create({ UserId: userId });
            console.warn(`[Bandit] Created missing stat for User ${userId}`);
        }
        return stat;
    }

    // Select Recipe based on Tau
    static async selectRecipe(tau) {
        let tier = '3min';
        if (tau < 90) tier = '1min';
        else if (tau < 150) tier = '2min';

        let recipe = await Recipe.findOne({ where: { tier } });
        if (!recipe) recipe = await Recipe.findOne({ where: { tier: '3min' } });

        return recipe;
    }

    // Update Tau based on feedback
    static async updateTau(userId, isOk, sessionDuration) {
        const stat = await this.getTau(userId);
        const currentTau = stat.tau_mu;
        let newTau = currentTau;

        if (isOk) {
            newTau = currentTau + 5;
        } else {
            newTau = currentTau - 15;
        }

        // Clamp
        if (newTau < 150) newTau = 150; // Min 2.5 min
        if (newTau > 240) newTau = 240; // Max 4 min

        stat.tau_mu = newTau;
        await stat.save();
        return newTau;
    }

    static async calculateEffectiveTau(userId, now = new Date()) {
        const stat = await this.getTau(userId);
        let tau = stat.tau_mu;
        let reasoning = "Standard Routine.";

        const hour = now.getHours();

        // 1. Time Context: Morning Rush (6:00 - 10:00)
        if (hour >= 6 && hour < 10) {
            tau = tau * 0.8;
            reasoning = "Morning Rush detected. Speed up.";
            console.log(`[Bandit] Context: Morning Rush. Tau scaled to ${tau}`);
        }

        // 2. Weather Context
        const temp = await WeatherService.getCurrentTemperature();
        if (temp !== null) {
            if (temp < 10) {
                tau = tau * 1.15; // +15% for Cold
                reasoning = `It's freezing (${temp}°C). Take your time.`;
                console.log(`[Bandit] Context: Cold (${temp}°C). Tau scaled to ${tau}`);
            } else if (temp > 30) {
                tau = tau * 0.9; // -10% for Hot
                reasoning = `It's sweltering (${temp}°C). Quick wash.`;
                console.log(`[Bandit] Context: Hot (${temp}°C). Tau scaled to ${tau}`);
            }
        }

        // 3. The "3-Minute Anchor" Clamp
        // We want to keep it close to 180s (3 mins) to lower the hurdle.
        // Min: 2.5 mins (150s), Max: 4 mins (240s)
        if (tau < 150) tau = 150;
        if (tau > 240) tau = 240;

        return { tau: Math.round(tau), reasoning };
    }

    static async getOrCreateUser(deviceId) {
        if (!deviceId) return null;
        let user = await User.findOne({ where: { device_id: deviceId } });
        if (!user) {
            user = await User.create({ device_id: deviceId });
            await BanditStat.create({ UserId: user.id });
        }
        return user;
    }
}

module.exports = BanditService;
