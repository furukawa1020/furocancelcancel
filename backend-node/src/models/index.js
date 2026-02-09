const sequelize = require('./database');
const User = require('./User');
const Session = require('./Session');
const BanditStat = require('./BanditStat');
const Recipe = require('./Recipe');

// Associations
User.hasMany(Session);
Session.belongsTo(User);

User.hasOne(BanditStat);
BanditStat.belongsTo(User);

module.exports = {
    sequelize,
    User,
    Session,
    BanditStat,
    Recipe
};
