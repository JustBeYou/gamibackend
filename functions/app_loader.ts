const loadFunctions = require('firebase-function-tools');
import {Router} from 'express';

export const loadedFunctions = {} as DynamicObject;
loadFunctions(__dirname, loadedFunctions, '.func.js', (cloudFunction: Router) => {
    return cloudFunction;
});