const functions = require('firebase-functions');
const express = require('express');

const app = express();
app.get('/', (req, res) => {
    res.send('ok');
});

module.exports = functions.https.onRequest(app);
