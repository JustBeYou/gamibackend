import {Request, Response, Router} from 'express';
import * as permissions from '../permissions';
import {Identifier} from '../models/identifier';
import * as errorHandlers from '../errorHandlers';
import * as identifierErrorHandlers from './errorHandlers';
import { Transaction } from 'sequelize/types';
const {getMainDatabase} = require('../database');

const router = Router();
export default router;

router.post(
    '/',
    [
        permissions.necessary(['IDENTIFIERS']),
        errorHandlers.requestEmptyData,
    ],
    async (req: Request, res: Response) => {
        const context = permissions.getValidContext(req);
        const isAdmin = context.check('ADMIN_IDENTIFIERS');

        await errorHandlers.safeResponse(res, async () => {
            await getMainDatabase().executeTransaction(async (transaction: Transaction) => {
                const identifierRefs = await Identifier.findAll({
                    where: {
                        id: req.body.data.id as number,
                    },
                    transaction,
                });

                for (const identifierRef of identifierRefs) {
                    identifierErrorHandlers.validateReference(identifierRef, context.token, isAdmin);
                    await Identifier.moveToTrash(identifierRef, context.token, transaction);
                }
            });

            res.json({status: 'ok'});
        });
    },
);


