const express = require('express');
const cors = require('cors');
const app = express();
const { sequelize, Recipe } = require('./src/models');

const AgentService = require('./src/services/AgentService');

// Middleware
app.use(cors());
app.use(express.json());

// Start the Tyrant
AgentService.start();

// Root Route (Health Check)
app.get('/', (req, res) => {
    res.send("Intentless Backend Operational. The Tyrant is watching.");
});

// --- ROUTES ---

// 0. SUMMON (Delegated to Agent)
app.post('/summon', (req, res) => {
    AgentService.manualSummon();
    res.json({ status: 'summoning' });
});

app.get('/summon/status', (req, res) => {
    res.json({ isSummoning: AgentService.isSummoning });
});

app.post('/summon/stop', (req, res) => {
    AgentService.stopSummon();
    res.json({ status: 'stopped' });
});

// 1. SESSIONS
// --- AGENT FSM ROUTES ---

// 1. EVENT: HOME_DETECTED -> AUTO_START (NFC Trigger)
// Input: { device_id }
// Output: Session State (Running)
app.post('/p/nfc/start', async (req, res) => {
    const { device_id } = req.body;
    // user lookup or create
    let user = await User.findOne({ where: { device_id } });
    if (!user) user = await User.create({ device_id });

    // 1. Check if already RUNNING
    const existing = await Session.findOne({
        where: { UserId: user.id, status: 'running' }
    });

    if (existing) {
        // Idempotency: If running, return it.
        // CHECK TIMER
        const now = new Date();
        if (now > existing.ends_at) {
            // Expired!
            existing.status = 'completed';
            existing.finished_at = existing.ends_at; // It finished when timer finished
            await existing.save();
            // Create NEW session? Or say "Relax"? 
            // Agent Rule: 1 bath per arrival? 
            // Let's allow restart if expired.
        } else {
            return res.json(existing);
        }
    }

    // 2. State Transition: IDLE -> RUNNING
    // "Auto Start" Logic
    const now = new Date();
    const ends_at = new Date(now.getTime() + 180 * 1000); // EXACTLY 180s

    // Get Recipe (Standard)
    const recipe = await Recipe.findOne({ where: { tier: '3min' } }); // Enforce 3min

    // Create Session
    const session = await Session.create({
        UserId: user.id,
        status: 'running',
        started_at: now,
        ends_at: ends_at,
        tau_limit: 180,
        recipe_id: recipe ? recipe.id : null
    });

    console.log(`[Agent] HOME_DETECTED (User ${user.id}). State -> RUNNING. Ends: ${ends_at.toISOString()}`);
    res.json(session);
});

// 2. POLLING: GET STATE
// Input: ?device_id=...
// Output: Session State
app.get('/sessions/current', async (req, res) => {
    const { device_id } = req.query;
    if (!device_id) return res.status(400).json({ error: "device_id required" });

    const user = await User.findOne({ where: { device_id } });
    if (!user) return res.json({ status: 'idle' });

    // Find active or recently completed
    const session = await Session.findOne({
        where: { UserId: user.id },
        order: [['createdAt', 'DESC']]
    });

    if (!session) return res.json({ status: 'idle' });

    // Timer Enforcement
    if (session.status === 'running') {
        const now = new Date();
        if (now > session.ends_at) {
            // Event: TIMER_EXPIRED
            console.log(`[Agent] Session ${session.id} TIMER_EXPIRED.`);
            session.status = 'completed';
            session.finished_at = session.ends_at;
            await session.save();
        }
    }

    // Return logic
    // If completed long ago (> 1 hour), probably IDLE now.
    const now = new Date();
    if (session.status !== 'running' && (now - new Date(session.updatedAt) > 3600000)) {
        return res.json({ status: 'idle' });
    }

    res.json(session);
});


// 3. EVENT: DONE_PROOF (NFC End)
// Input: { device_id, session_id }
// Output: Updated Session
app.post('/p/nfc/done', async (req, res) => {
    const { device_id, session_id } = req.body; // session_id is optional if we assume current
    // ... validation ...
    const user = await User.findOne({ where: { device_id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const session = await Session.findOne({
        where: { UserId: user.id, status: 'running' }
    });

    if (!session) {
        // Maybe already completed by timer?
        return res.json({ status: 'completed', note: 'Timer already expired or no session' });
    }

    // State Transition: RUNNING -> COMPLETED
    session.status = 'completed';
    session.finished_at = new Date();
    session.proof_state = 'done'; // Legacy/Extra log
    await session.save();

    console.log(`[Agent] DONE_PROOF received. Session ${session.id} COMPLETED.`);
    res.json(session);
});

// 4. FEEDBACK (Learning)
app.post('/sessions/:id/feedback', async (req, res) => {
    const { id } = req.params;
    const { rating } = req.body; // 'ok' or 'bad'

    const session = await Session.findByPk(id);
    if (session) {
        session.feedback = rating;
        await session.save();
        // Update Bandit Q-value here (Future)
        console.log(`[Agent] Feedback recorded: ${rating}`);
    }
    res.json({ status: 'ok' });
});

// LEGACY SUPPORT (Optional, mapping old routes to new logic if needed, or delete)
// For now, replacing the old /sessions POST with the new /p/nfc/start logic wrapper if needed
// Or just let client usage change.
// The user said "Convert current app", so we effectively replace the main logic.

// We keep the DB init logic below...

async function initData() {
    try {
        // SQLite Workaround for Alter Table with Foreign Keys
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        await sequelize.sync({ alter: true });
        await sequelize.query('PRAGMA foreign_keys = ON;');

        const count = await Recipe.count();
        if (count === 0) {
            // Tier 3: Standard (180s)
            await Recipe.create({
                title: "Standard Intentless",
                base_duration_sec: 180,
                tier: '3min',
                steps_json: JSON.stringify([
                    { time: 0, text: "シャワーON (Shower ON)" },
                    { time: 10, text: "重要部位のみ (Critical Areas)" },
                    { time: 130, text: "すすぐ (Rinse)" },
                    { time: 150, text: "タオルへ (To Towel)" }
                ])
            });

            // Tier 2: Survival (120s)
            await Recipe.create({
                title: "Survival Mode",
                base_duration_sec: 120,
                tier: '2min',
                steps_json: JSON.stringify([
                    { time: 0, text: "シャワーON" },
                    { time: 10, text: "脇・股・足だけ (Armpits/Feet)" },
                    { time: 90, text: "即すすぐ (Quick Rinse)" },
                    { time: 100, text: "脱出 (Escape)" }
                ])
            });

            // Tier 1: Reset (60s)
            await Recipe.create({
                title: "Absolute Minimum",
                base_duration_sec: 60,
                tier: '1min',
                steps_json: JSON.stringify([
                    { time: 0, text: "お湯を浴びる (Just Water)" },
                    { time: 30, text: "深呼吸 (Breathe)" },
                    { time: 45, text: "出る (Exit)" },
                    { time: 50, text: "タオル (Towel)" }
                ])
            });
            console.log("Seeded initial recipes.");
        }
    } catch (e) {
        console.error("Init Data Failed:", e);
    }
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Intentless Backend (Modular) running on port ${PORT}`);
    await initData();
});
