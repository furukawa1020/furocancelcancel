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

        newTau = Math.max(45, Math.min(300, newTau));

        stat.tau_mu = newTau;
        await stat.save();
        return newTau;
    }

    static async calculateEffectiveTau(userId, now = new Date()) {
        const stat = await this.getTau(userId);
        let tau = stat.tau_mu;

        const hour = now.getHours();

        // 1. Time Context: Morning Rush (6:00 - 10:00)
        if (hour >= 6 && hour < 10) {
            tau = tau * 0.8;
            console.log(`[Bandit] Context: Morning Rush. Tau scaled to ${tau}`);
        }

        // 2. Weather Context
        const temp = await WeatherService.getCurrentTemperature();
        if (temp !== null) {
            if (temp < 10) {
                tau = tau * 1.15; // +15% for Cold
                console.log(`[Bandit] Context: Cold (${temp}°C). Tau scaled to ${tau}`);
            } else if (temp > 30) {
                tau = tau * 0.9; // -10% for Hot
                console.log(`[Bandit] Context: Hot (${temp}°C). Tau scaled to ${tau}`);
            }
        }

        return Math.round(tau);
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
