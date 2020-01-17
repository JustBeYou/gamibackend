const express = require('express');
const permissions = require('../permissions.js');
const {Collection} = require('../models/collection.js');
const {Module} = require('../models/module.js');
const moduleQueryHelpers = require('../module/queryHelpers.js');
const moduleErrorHandlers = require('../module/errorHandlers.js');
const errorHandlers = require('../errorHandlers.js');
const {dbConnection} = require('../config.js');
const passwordHash = require('password-hash');

const router = express.Router();

async function createModules(req, modulesData, collectionRef, transaction) {
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
            collectionRef,
            transaction,
        );

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

            const result = await dbConnection.transaction(async (transaction) => {
                if (collectionData.password !== undefined) {
                    collectionData.password = passwordHash.generate(collectionData.password);
                }

                const collectionRef = await Collection.create(
                    collectionData,
                    {
                        transaction,
                    });
                const createdModules = await createModules(
                    req,
                    modulesData,
                    collectionRef,
                    transaction,
                );

                let result = {
                    collection: collectionRef,
                    modules: createdModules,
                };

                return result;
            });
            res.json({status: 'ok', result});
        });
    },
);

module.exports = router;
