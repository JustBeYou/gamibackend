const firestore = require('./config.js').firestore;
const permissions = require('./permissions.js');

async function getAccessCode(code) {
    const codeRef = await firestore.collection('accessCodes').doc(code).get();

    if (!codeRef.exists) {
        return null;
    }

    return codeRef.data();
}

// access codes and tokens have the same proprieties
async function validateAccessCode(code) {
    const codeObj = await getAccessCode(code);
    if (codeObj === null) return false;
    return permissions.permissionValidators[code.type](codeObj);
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

module.exports = {
    getAccessCode,
    isAssociated,
    canAssociateAnotherToken,
    associate,
    validateAccessCode,
};
