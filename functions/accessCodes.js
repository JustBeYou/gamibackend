const firestore = require('./config.js').firestore;
const permissions = require('./permissions.js');

// TODO: access codes functions are a little bit inconsistent
async function createAccessCode(properties) {
    const newCode = await firestore.collection('accessCodes').add(properties);
    return newCode.id;
}

async function listAccessCodes(id) {
    const docs = await firestore.collection('accessCodes').where('parentCollection', '==', id).get();

    let result = [];
    docs.forEach(doc => {
        result.push({id: doc.id, ...doc.data()});
    });
    return result;
}

async function deleteAllAccessCodes(id) {
    const docs = await firestore.collection('accessCodes').where('parentCollection', '==', id).get();

    docs.forEach(doc => {
        doc.ref.delete();
    });
}

async function getAccessCode(code) {
    const codeRef = await firestore.collection('accessCodes').doc(code).get();

    if (!codeRef.exists) {
        return null;
    }

    return codeRef.data();
}

function modifyAccessCode(code, properties) {
    firestore.collection('accessCodes').doc(code).update(properties);
}

// access codes and tokens have the same proprieties
async function validateAccessCode(code) {
    const codeObj = await getAccessCode(code);
    if (codeObj === null) return false;
    return permissions.permissionValidators[codeObj.type](codeObj);
}

function canAssociateAnotherToken(codeObj) {
    return Object.keys(codeObj.assocTokens).length < codeObj.maxUsers;
}

function isAssociated(codeObj, token) {
    return token in codeObj.assocTokens;
}

async function associate(code, token) {
    const codeDocRef = firestore.collection('accessCodes').doc(code);
    const result = await firestore.runTransaction(async transaction => {
        const codeRef = await transaction.get(codeDocRef);
        if (!codeRef.exists) return false;

        const codeObj = codeRef.data();
        if (!canAssociateAnotherToken(codeObj) || isAssociated(codeObj, token)) {
            return false;
        }

        transaction.update(codeDocRef, {
            [`assocTokens.${token}`]: null,
        });
        return true;
    });

    return result;
}

function canAcccessCollection(codeObj, collection) {
    return collection === codeObj.parentCollection;
}

async function verifyAccessCode(reference, accessCode, token) {
    const codeObj = await getAccessCode(accessCode);
    if (canAcccessCollection(codeObj, reference) === false) {
        throw new Error('access code is not related to the collection');
    }

    const associated = await associate(accessCode, token);
    if (associated === false) {
        throw new Error('associated tokens max limit exceeded');
    }

    const isValid = permissions.permissionValidators[codeObj.type](codeObj);
    if (isValid === false) {
        throw new Error('access code is expirated');
    }
}

module.exports = {
    getAccessCode,
    isAssociated,
    canAssociateAnotherToken,
    associate,
    validateAccessCode,
    createAccessCode,
    listAccessCodes,
    deleteAllAccessCodes,
    canAcccessCollection,
    verifyAccessCode,
    modifyAccessCode,
};
