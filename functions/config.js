const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

let config = {};
config.apiKey = 'AIzaSyDzAkKM6VenMMFeDi8Fg8tJSsuRe3gSF58';
config.credential = admin.credential.cert(serviceAccount);

admin.initializeApp(config);

module.exports = {
    config,
    admin,
    firestore: admin.firestore(),
    auth: admin.auth(),
};
