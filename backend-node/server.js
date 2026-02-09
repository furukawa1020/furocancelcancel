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

// Models
const Session = sequelize.define('Session', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proof_state: { type: DataTypes.STRING, defaultValue: 'none' }, // none, started, done
    started_at: DataTypes.DATE,
    finished_at: DataTypes.DATE,
    recipe_id: DataTypes.INTEGER
});

const Recipe = sequelize.define('Recipe', {
    title: DataTypes.STRING,
    steps_json: DataTypes.JSON, // Array of {time: sec, text: string}
    duration_sec: DataTypes.INTEGER
});

// Init Data
const initData = async () => {
    await sequelize.sync({ force: true });

    await Recipe.create({
        title: "Standard 3-min Bath",
        duration_sec: 180,
        steps_json: JSON.stringify([
            { time: 0, text: "シャワーON" },
            { time: 10, text: "首・脇・股・足だけ洗う（最小部位）" },
            { time: 140, text: "すすぐ" },
            { time: 160, text: "拭く（髪は今日は捨てる）" }
        ])
    });
    console.log("Database initialized.");
};

// Routes

// 1. Create/Start Session (from NFC Start or Web)
// GET /p/nfc/start?sid=... (Conceptually) - simplified for hackathon
app.post('/sessions', async (req, res) => {
    const session = await Session.create({
        proof_state: 'started',
        started_at: new Date(),
        recipe_id: 1
    });
    res.json(session);
});

// 2. Poll Session State
app.get('/sessions/:id', async (req, res) => {
    const session = await Session.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: "Not found" });

    // Calculate remaining time
    const now = new Date();
    const elapsed = (now - new Date(session.started_at)) / 1000;
    const remaining = Math.max(0, 180 - elapsed);

    res.json({
        ...session.toJSON(),
        remaining_sec: remaining
    });
});

// 3. Mark as Done (NFC Towel)
// GET /p/nfc/done?sid=...
app.get('/p/nfc/done', async (req, res) => {
    // In a real demo, we'd pass the SID in query. 
    // For MVP/Demo simple setup, we might just update the *latest* session or specific one.
    // Let's assume we pass ?sid=<uuid>
    const sid = req.query.sid;
    if (!sid) return res.status(400).send("Missing SID");

    const session = await Session.findByPk(sid);
    if (session) {
        session.proof_state = 'done';
        session.finished_at = new Date();
        await session.save();
        res.send("<h1>休め。(Rest.)</h1>");
    } else {
        res.status(404).send("Session not found");
    }
});

// 4. Feedback
app.post('/sessions/:id/feedback', async (req, res) => {
    // Logic for Bandit update would go here
    console.log(`Feedback for ${req.params.id}: ${req.body.rating}`);
    res.json({ status: "ok" });
});

// Start Server
const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Backend running on port ${PORT}`);
    await initData();
});
