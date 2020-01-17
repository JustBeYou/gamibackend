const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const {Sequelize} = require('sequelize');

let config = {};
config.apiKey = 'AIzaSyDzAkKM6VenMMFeDi8Fg8tJSsuRe3gSF58';
config.credential = admin.credential.cert(serviceAccount);

admin.initializeApp(config);

// TODO: use Google MySQL in production mode
/*const dbConnection = new Sequelize('gami', 'gami', 'qwerty123456', {
    host: '35.233.1.255',
    port: 3306,
    dialect: 'mysql',
});*/
const dbConnection = new Sequelize('sqlite:gami.db');

module.exports = {
    config,
    admin,
    firestore: admin.firestore(),
    auth: admin.auth(),
    dbConnection,
};
