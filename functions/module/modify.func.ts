import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import { Module, classOfModuleType, ModuleUpdateSchema } from '../models/module';
import * as moduleErrorHandlers from './errorHandlers';
import {getMainDatabase} from '../database';
import { Transaction } from 'sequelize/types';
import { getValidContext } from '../permissions';

const router = Router();
export default router;

async function updateModule(
    toUpdateProps: ModuleUpdateSchema, 
    token: string, 
    isAdmin: boolean, 
    transaction: Transaction) {

    const moduleRef = await Module.findOne({
        where: {
            id: toUpdateProps.id,
        },
        transaction,
    });

    const validModuleRef = moduleErrorHandlers.validateReference(moduleRef, token, isAdmin);
    moduleErrorHandlers.validateImmutable(toUpdateProps.update);

    const moduleClass = classOfModuleType[validModuleRef.type];
    const concreteModuleRef = await moduleClass.findOne({
        where: {
            moduleId: validModuleRef.id,
        },
        transaction,
    });

    const concrete = await concreteModuleRef.update(toUpdateProps.update, {transaction});
    const base = await validModuleRef.update({
        updatedByToken: token,
    }, {transaction});

    const plainObject = base.get({plain: true}) as DynamicObject;
    plainObject[moduleClass.name] = concrete.get({plain: true});
    
    return plainObject;
}

router.post(
    '/',
    [
        permissions.necessary(['ITEMS']),
        errorHandlers.requestEmptyData,
    ],
    async (req: Request, res: Response) => {
        const context = getValidContext(req);
        const isAdmin = context.check('ADMIN_ITEMS');

        await errorHandlers.safeResponse(res, async () => {
            const result = await getMainDatabase().executeTransaction((transaction: Transaction) => {
                return updateModule(
                    req.body.data as ModuleUpdateSchema,
                    context.token,
                    isAdmin,
                    transaction,
                );
            });
            res.json({status: 'ok', result});
        });
    },
);

