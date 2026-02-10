const { Session, Recipe } = require('../models');
const BanditService = require('../services/BanditService');

class SessionController {
    static async create(req, res) {
        try {
            const { source, device_id } = req.body;
            const effDeviceId = device_id || (source === 'mobile_nfc' ? 'unknown_mobile' : 'default_test_user');

            const user = await BanditService.getOrCreateUser(effDeviceId);
            // Use Contextual Bandit Logic
            const tau = await BanditService.calculateEffectiveTau(user.id);
            const recipe = await BanditService.selectRecipe(tau);

            const session = await Session.create({
                proof_state: 'started',
                started_at: new Date(),
                recipe_id: recipe.id,
                tau_limit: tau,
                UserId: user.id
            });

            res.json({ ...session.toJSON(), recipe_title: recipe.title });
        } catch (e) {
            console.error(e);
            res.status(500).send("Error creating session");
        }
    }

    static async get(req, res) {
        try {
            const session = await Session.findByPk(req.params.id);
            if (!session) return res.status(404).json({ error: "Not found" });

            const now = new Date();
            const elapsed = (now - new Date(session.started_at)) / 1000;
            const remaining = Math.max(0, session.tau_limit - elapsed);

            const recipe = await Recipe.findByPk(session.recipe_id);

            res.json({
                ...session.toJSON(),
                remaining_sec: remaining,
                recipe: recipe
            });
        } catch (e) {
            console.error(e);
            res.status(500).send("Error fetching session");
        }
    }

    static async feedback(req, res) {
        try {
            const session = await Session.findByPk(req.params.id);
            if (!session) return res.status(404).json({ error: "Not found" });

            const { rating } = req.body;
            session.feedback = rating;
            if (!session.finished_at) session.finished_at = new Date();
            await session.save();

            const duration = (new Date(session.finished_at) - new Date(session.started_at)) / 1000;
            const newTau = await BanditService.updateTau(session.UserId, rating === 'ok', duration);

            console.log(`[Bandit] User: ${session.UserId} | Feedback: ${rating}. New Tau: ${newTau}`);
            res.json({ status: "accepted", new_tau: newTau });
        } catch (e) {
            console.error(e);
            res.status(500).send("Error processing feedback");
        }
    }
}

module.exports = SessionController;
