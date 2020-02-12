import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import { Collection, CollectionSchema } from '../models/collection';
import { Module, ModuleSchema, ConcreteModuleSchema } from '../models/module';
import * as moduleQueryHelpers from '../module/queryHelpers';
import * as moduleErrorHandlers from '../module/errorHandlers';
import * as errorHandlers from '../errorHandlers';
import {getMainDatabase} from '../database';
import * as passwordHash from 'password-hash';
import { Transaction } from 'sequelize/types';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

async function createModules(
    context: AuthContext, 
    modulesData: Array<ModuleSchema & ConcreteModuleSchema>, 
    collectionRef: Collection, 
    transaction: Transaction) {

    const result: Array<Module> = [];

    if (modulesData === []) {
        return result;
    }

    for (const moduleData of modulesData) {
        moduleErrorHandlers.isAllowedToCreateModule(context, moduleData.type);

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
    async (req: Request, res: Response) => {
        let modulesData: Array<ModuleSchema & ConcreteModuleSchema>= [];
        const collectionData = {...req.body.data} as DynamicObject;
        if (collectionData['modules'] !== undefined) {
            modulesData = [...collectionData['modules']];
            delete collectionData['modules'];
        }

        await errorHandlers.safeResponse(res, async () => {
            const context = getValidContext(req);
            collectionData['parentToken'] = context.token;

            const result = await getMainDatabase().executeTransaction(async (transaction: Transaction) => {
                if (collectionData['password'] !== undefined) {
                    collectionData['password'] = passwordHash.generate(collectionData['password']);
                }

                const collectionRef = await Collection.create(
                    collectionData as CollectionSchema,
                    {
                        transaction,
                    });
                const createdModules = await createModules(
                    context,
                    modulesData,
                    collectionRef,
                    transaction,
                );

                return {
                    collection: collectionRef,
                    modules: createdModules,
                } as DynamicObject;
            });
            res.json({status: 'ok', result});
        });
    },
);

