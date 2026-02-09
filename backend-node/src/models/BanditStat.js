const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const BanditStat = sequelize.define('BanditStat', {
    tau_mu: { type: DataTypes.FLOAT, defaultValue: 180.0 },
    tau_sigma: { type: DataTypes.FLOAT, defaultValue: 20.0 },
    alpha: { type: DataTypes.FLOAT, defaultValue: 0.1 },
    UserId: DataTypes.UUID
});

module.exports = BanditStat;
