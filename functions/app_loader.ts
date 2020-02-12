const loadFunctions = require('firebase-function-tools');
import {Router} from 'express';

export const appRouters = {} as DynamicObject;
loadFunctions(__dirname, appRouters, '.func.js', (cloudFunction: Router) => {
    return cloudFunction;
});
