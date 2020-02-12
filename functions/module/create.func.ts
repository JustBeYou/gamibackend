import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import * as errorHandlers from '../errorHandlers';
import {Module} from '../models/module';
import {parseAndValidateCreationData} from './queryHelpers';
import {isAllowedToCreateModule} from './errorHandlers';
import {getMainDatabase} from '../database';
import { getValidContext } from '../permissions';
import { Transaction } from 'sequelize/types';

const router = Router();
export default router;

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
            const result = await getMainDatabase().executeTransaction(async (transaction: Transaction) => {
                const {
                    baseModuleProperties,
                    concreteModuleProperties,
                    collectionRef,
                } = await parseAndValidateCreationData(
                    req.body.data,
                    context.token,
                    isAdmin,
                    transaction,
                );

                isAllowedToCreateModule(context, baseModuleProperties.type);

                return await Module.typedCreate(
                    baseModuleProperties,
                    concreteModuleProperties,
                    collectionRef,
                    transaction,
                );
            });
            res.json({status: 'ok', result});
        });
    },
);

