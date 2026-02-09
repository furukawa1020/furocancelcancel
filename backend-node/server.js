const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(cors());
app.use(express.json());

// Database Setup (SQLite)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false
});

// --- MODELS ---

const Session = sequelize.define('Session', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proof_state: { type: DataTypes.STRING, defaultValue: 'none' }, // none, started, done
    started_at: DataTypes.DATE,
    finished_at: DataTypes.DATE,
    recipe_id: DataTypes.INTEGER,
    tau_limit: DataTypes.INTEGER, // The Calculated Limit for this session
    feedback: DataTypes.STRING // ok / bad
});

const BanditStat = sequelize.define('BanditStat', {
    tau_mu: { type: DataTypes.FLOAT, defaultValue: 180.0 }, // Mean endurance time (starts at 3 min)
    tau_sigma: { type: DataTypes.FLOAT, defaultValue: 20.0 }, // Variance
    alpha: { type: DataTypes.FLOAT, defaultValue: 0.1 } // Learning rate
});

const Recipe = sequelize.define('Recipe', {
    title: DataTypes.STRING,
    steps_json: DataTypes.JSON,
    base_duration_sec: DataTypes.INTEGER
});

// --- LOGIC: Intentless Engine ---

// Get current Tau estimate
async function getTau() {
    let stat = await BanditStat.findOne();
    if (!stat) stat = await BanditStat.create({});
    return stat;
}

// Update Tau based on feedback
async function updateTau(isOk, sessionDuration) {
    const stat = await getTau();
    const currentTau = stat.tau_mu;
    const alpha = stat.alpha;

    let newTau = currentTau;

    if (isOk) {
        // If OK, we confirm the current time was acceptable.
        // We might nudge it slightly if we wanted to find the UPPER limit,
        // but for "Intentless", finding a comfortable minimum is safer for retention.
        // So we keep it or very slightly increase.
        // newTau = currentTau + 5; 
    } else {
        // If BAD, it was too long. Reduce Tau.
        // Failure is expensive (user churn), so we penalize heavily.
        newTau = currentTau - 15;
    }

    // Clamp values (Minimum 60s, Max 300s)
    newTau = Math.max(60, Math.min(300, newTau));

    stat.tau_mu = newTau;
    await stat.save();
    return newTau;
}

// --- INIT ---
const initData = async () => {
    await sequelize.sync();

    const count = await Recipe.count();
    if (count === 0) {
        await Recipe.create({
            title: "Standard Intentless",
            base_duration_sec: 180,
            steps_json: JSON.stringify([
                { time: 0, text: "シャワーON (Shower ON)" },
                { time: 10, text: "重要部位のみ (Critical Areas Only)" },
                { time: 130, text: "すすぐ (Rinse)" },
                { time: 150, text: "タオルへ (To Towel)" }
            ])
        });
    }
    console.log("Database initialized with Intentless Engine.");
};

// --- ROUTES ---

// 1. NFC Trigger / Web Start -> Creates Session with Optimized Tau
app.post('/sessions', async (req, res) => {
    try {
        const stat = await getTau();
        const tau = Math.floor(stat.tau_mu);

        const session = await Session.create({
            proof_state: 'started',
            started_at: new Date(),
            recipe_id: 1, // Default recipe for now
            tau_limit: tau
        });

        res.json(session);
    } catch (e) {
        console.error(e);
        res.status(500).send("Error creating session");
    }
});

// 2. Poll Session
app.get('/sessions/:id', async (req, res) => {
    const session = await Session.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    // Calculate remaining based on TAU LIMIT, not fixed 3 mins
    const now = new Date();
    const elapsed = (now - new Date(session.started_at)) / 1000;
    const remaining = Math.max(0, session.tau_limit - elapsed);

    const recipe = await Recipe.findByPk(session.recipe_id);

    res.json({
        ...session.toJSON(),
        remaining_sec: remaining,
        recipe: recipe
    });
});

// 3. Mark Done (NFC Towel)
app.get('/p/nfc/done', async (req, res) => {
    const sid = req.query.sid;
    // In demo, if no SID, maybe find latest active?
    let session;
    if (sid) {
        session = await Session.findByPk(sid);
    } else {
        session = await Session.findOne({
            order: [['createdAt', 'DESC']],
            where: { proof_state: 'started' }
        });
    }

    if (session) {
        session.proof_state = 'done';
        session.finished_at = new Date();
        await session.save();
        res.send("<h1>Target Acquired. Rest.</h1>");
    } else {
        res.status(404).send("No active session found.");
    }
});

// 4. Feedback -> Update Bandit
app.post('/sessions/:id/feedback', async (req, res) => {
    const session = await Session.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    const { rating } = req.body; // 'ok' or 'bad'
    session.feedback = rating;
    await session.save(); // Save feedback FIRST

    // BANDIT UPDATE
    // Ensure finished_at exists (if manually triggered from UI before NFC)
    if (!session.finished_at) session.finished_at = new Date();
    await session.save();

    const duration = (new Date(session.finished_at) - new Date(session.started_at)) / 1000;
    const newTau = await updateTau(rating === 'ok', duration);

    console.log(`[Bandit] Feedback: ${rating}. New Tau: ${newTau}`);
    res.json({ status: "accepted", new_tau: newTau });
});

// 5. ESP32 Mock Endpoint
app.post('/device/event', async (req, res) => {
    console.log("Device Event:", req.body);
    res.json({ status: "received" });
});

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Intentless Backend running on port ${PORT}`);
    await initData();
});
