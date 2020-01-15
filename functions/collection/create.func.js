const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const {Module} = require('../models/module.js');
const moduleQueryHelpers = require('../module/queryHelpers.js');
const moduleErrorHandlers = require('../module/errorHandlers.js');
const errorHandlers = require('../errorHandlers.js');

const router = express.Router();

async function createModules(req, modulesData, collectionRef) {
    let result = [];

    if (modulesData === null) {
        return result;
    }

    for (const moduleData of modulesData) {
        moduleErrorHandlers.isAllowedToCreateModule(req, moduleData.type);

        const {
            baseModuleProperties,
            concreteModuleProperties,
        } = moduleQueryHelpers.parseCreationData(moduleData, collectionRef);

        const createdModule = await Module.typedCreate(
            baseModuleProperties,
            concreteModuleProperties,
            collectionRef);

        result.push(createdModule);
    }

    return result;
}

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    (req, res) => {
        let modulesData = null;
        let collectionData = {...req.body.data};
        if (collectionData.modules !== undefined) {
            modulesData = [...collectionData.modules];
            delete collectionData.modules;
        }

        errorHandlers.safeResponse(res, async () => {
            collectionData.parentToken = permissions.getReqToken(req);
            const collectionRef = await Collection.create(collectionData);
            const createdModules = await createModules(
                req,
                modulesData,
                collectionRef,
            );

            let result = {
                collection: collectionRef,
                modules: createdModules,
            };
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;
