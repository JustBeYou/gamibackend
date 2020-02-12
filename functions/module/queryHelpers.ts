import {Collection} from '../models/collection';
import * as collectionErrorHandlers from '../collection/errorHandlers';
import * as queryHelpers from '../models/queryHelpers';
import { Transaction } from 'sequelize/types';

// TODO: make this shorter
export function parseQuery(query: any, currentToken: string, allowCustomToken: boolean) {
    const preparedQuery = queryHelpers.parseQuery(query, currentToken, allowCustomToken);

    // TODO: building Module query must be optimized
    const baseAttributes = [
        'id',
        'index',
        'type',
        'parentToken',
        'updatedByToken',
        'deletedByToken',
        'inactive',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'CollectionId',
    ];
    const baseQuery = {where: {}} as any;
    for (const attr of baseAttributes) {
        // TODO: = could be dangerous for Objects, find a better way to copy
        if (preparedQuery.where[attr] !== undefined) {
            baseQuery.where[attr] = preparedQuery.where[attr];
            delete preparedQuery.where[attr];
        }
    }

    if (Object.entries(preparedQuery.where).length !== 0 && baseQuery.where.type === undefined) {
        throw new Error('Type must be specified for concrete queries.');
    }

    const limit = preparedQuery.limit;
    const offset = preparedQuery.offset;
    delete preparedQuery.limit;
    delete preparedQuery.offset;

    const finalQuery = {
        limit,
        offset,
        baseQuery,
        concreteQuery: preparedQuery,
    };

    return finalQuery;
}

export function parseCreationData(properties: any, collectionRef: Collection) {
    const baseModuleProperties = {
        type: properties.type,
        index: collectionRef.moduleCount,
        CollectionId: collectionRef.id,
        parentToken: collectionRef.parentToken,
    };
    const concreteModuleProperties = {...properties};
    delete concreteModuleProperties.type;
    delete concreteModuleProperties.collectionId;

    return {
        baseModuleProperties,
        concreteModuleProperties,
        collectionRef,
    };
}

export async function parseAndValidateCreationData(properties: any, currentToken: string, isAdmin: boolean, transaction: Transaction) {
    const query = {
        where: {
            id: properties.CollectionId,
        },
    } as any;
    if (transaction !== undefined) {
        query.transaction = transaction;
    }

    const collectionRef = await Collection.findOne(query);
    const validCollectionRef = collectionErrorHandlers.validateReference(collectionRef, currentToken, isAdmin);

    return parseCreationData(properties, validCollectionRef);
}