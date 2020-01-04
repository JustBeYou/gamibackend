const firestore = require('./config.js').firestore;

async function getTokenPermissions(token) {
    const tokenRef = await firestore.collection('tokens').doc(token).get();

    if (!tokenRef.exists) {
        return null;
    }

    return tokenRef.data()['permissions'];
}

const permissionValidators = {
    PERMANENT: () => {
        return true;
    },

    LIMITED_CALLS: permissionProps => {
        return permissionProps.currCalls < permissionProps.maxCalls;
    },

    LIMITED_TIME: permissionProps => {
        return Date.now() < permissionProps.expDate;
    },
};

function validatePermission(permissions, key) {
    if (!(key in permissions)) return false;
    return permissionValidators[permissions[key].type](permissions[key]);
}

const requestField = 'currentPermissions';
const tokenHeader = 'token';
async function middleware(req, res, next) {
    if (!(tokenHeader in req.headers)) {
        req[requestField] = null;
    }
    else {
        const token = req.header(tokenHeader);
        const permissions = await getTokenPermissions(token);

        req[requestField] = permissions;
    }

    next();
}

function necessary(permissionsList) {
    return (req, res, next) => {
        if (req[requestField] === null) {
            res.status(403).json({message: 'Not authenticated.'});
            return ;
        }

        let validated = true;
        for (const permission of permissionsList) {
            validated = validated && validatePermission(req[requestField], permission);
        }

        if (validated) {
            next();
        }
        else {
            res.status(403).json({message: 'Insufficient permissions.'});
        }
    };
}

function check(req, permission) {
    return validatePermission(req[requestField], permission);
}

module.exports = {
    middleware,
    necessary,
    check,
    requestField,
    tokenHeader,
};
