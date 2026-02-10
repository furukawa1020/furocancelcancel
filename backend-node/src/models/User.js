const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    device_id: { type: DataTypes.STRING, unique: true },
    // Preference / Bandit State
    current_tier: { type: DataTypes.STRING, defaultValue: '3min' } // 3min, 2min, 1min
});

module.exports = User;
