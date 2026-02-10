const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Session = sequelize.define('Session', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // FSM State: IDLE (not persisted usually), UP -> RUNNING -> COMPLETED or ABORTED
    status: { type: DataTypes.STRING, defaultValue: 'running' }, // running, completed, aborted

    // Proof
    proof_state: { type: DataTypes.STRING, defaultValue: 'none' }, // none, started, done (Legacy but kept for compatibility validation)
    proof_type: { type: DataTypes.STRING, defaultValue: 'nfc_towel' }, // nfc_towel

    // Timers
    started_at: DataTypes.DATE, // When status -> running
    ends_at: DataTypes.DATE,   // started_at + 180s (Fixed)
    finished_at: DataTypes.DATE, // When status -> completed

    // Logic
    recipe_id: DataTypes.INTEGER,
    tau_limit: DataTypes.INTEGER,
    feedback: DataTypes.STRING, // ok / bad
    UserId: DataTypes.UUID
});

module.exports = Session;
