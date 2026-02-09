const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Session = sequelize.define('Session', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    proof_state: { type: DataTypes.STRING, defaultValue: 'none' }, // none, started, done
    started_at: DataTypes.DATE,
    finished_at: DataTypes.DATE,
    recipe_id: DataTypes.INTEGER,
    tau_limit: DataTypes.INTEGER,
    feedback: DataTypes.STRING, // ok / bad
    UserId: DataTypes.UUID
});

module.exports = Session;
