const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Recipe = sequelize.define('Recipe', {
    title: DataTypes.STRING,
    steps_json: DataTypes.JSON, // SQLite stores this as TEXT usually, but Sequelize handles JSON parsing if supported or via getter/setter
    base_duration_sec: DataTypes.INTEGER,
    tier: DataTypes.STRING // '3min', '2min', '1min'
});

module.exports = Recipe;
