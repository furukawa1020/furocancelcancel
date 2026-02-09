const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    device_id: { type: DataTypes.STRING, unique: true }
});

module.exports = User;
