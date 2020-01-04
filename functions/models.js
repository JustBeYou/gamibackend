const {Sequelize, Model, DataTypes} = require('sequelize');
const sequelize = new Sequelize('gami', 'gami', 'qwerty123456', {
    host: '35.233.1.255',
    port: 3306,
    dialect: 'mysql',
});

module.exports = {
};
