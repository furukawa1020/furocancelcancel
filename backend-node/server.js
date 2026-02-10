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
app.post('/sessions', async (req, res) => {
    // SQLite Workaround for Alter Table with Foreign Keys
    try {
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        await sequelize.sync({ alter: true });
        await sequelize.query('PRAGMA foreign_keys = ON;');
    } catch (e) {
        console.warn("Sync warning:", e.message);
        // Fallback: If structure changed too much, might need manual migration or force
    }

    // Agent is appeased. Stop screaming.
    AgentService.stopSummon();

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
    }
    console.log("Database initialized with Intentless Engine & Dynamic Recipes.");
});

const PORT = 3000;
app.listen(PORT, async () => {
    console.log(`Intentless Backend (Modular) running on port ${PORT}`);
    await initData();
});
