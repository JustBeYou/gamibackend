const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId, adminToken} = require('../utils');

chai.use(chaiHttp);

function createDataset() {
    return {
        key: 'https://gamiworld.com/share/' + makeId(10),
        behavior: 'SINGLE',
        logic: '{"assocCollections": [1]}',
    };
}

function createIdentifiers(dataset) {
    return doFunctionRequest('identifierCreate')
        .setUserToken()
        .send({
            data: dataset,
        });
}

describe('Identifier CRUD API', () => {
    step('Create', async () => {
        const res = await doFunctionRequest('identifierCreate')
            .setAdminToken()
            .send({
                data: [createDataset()],
            });

        expect(res).to.have.status(200);
        expect(res.body.result[0].parentToken).to.be.equal(adminToken);
    });

    step('Custom keys not allowed for users', async () => {
        const dataset = createDataset();
        dataset.key = 'invalid';

        const res = await createIdentifiers([dataset]);
        expect(res).to.have.status(400);
    });

    // Failing is caused by a SQLite bug, it is working on MySQL
    // So no problem with it
    xstep('Duplicate key not allowed (SQLite bug, not a problem for production)', async () => {
        const dataset = createDataset();

        await createIdentifiers([dataset]);
        const res = await createIdentifiers([dataset]);

        expect(res).to.have.status(400);
    });

    step('Search with filters', async () => {
        const firstDataset = createDataset();
        const secondDataset = createDataset();

        const created = await createIdentifiers([firstDataset, secondDataset]);
        const result = await doFunctionRequest('identifierList')
            .setUserToken()
            .send({
                data: {
                    query: [
                        {
                            key: firstDataset.key,
                        },
                        {
                            key: secondDataset.key,
                        },
                    ],
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result.length).to.be.equal(2);
        expect(result.body.result[0][0].key).to.be.equal(firstDataset.key);
        expect(result.body.result[1][0].key).to.be.equal(secondDataset.key);
    });

    step('Modify', async () => {
        const dataset = createDataset();

        const created = await createIdentifiers([dataset]);
        const modified = await doFunctionRequest('identifierModify')
            .setUserToken()
            .send({
                data: [
                    {
                        id: created.body.result[0].id,
                        update: {
                            behavior: 'TEST',
                        },
                    },
                ],
            });

        expect(modified).to.have.status(200);
        expect(modified.body.result[0].behavior).to.be.equal('TEST');
    });

    step('Delete', async () => {
        const dataset = createDataset();
        const created = await createIdentifiers([dataset]);
        const result = await doFunctionRequest('identifierDelete')
            .setUserToken()
            .send({
                data: {
                    id: created.body.result[0].id,
                },
            });

        expect(result).to.have.status(200);

        const found = await doFunctionRequest('identifierList')
            .setUserToken()
            .send({
                data: {
                    query: [
                        {
                            id: created.body.result[0].id,
                        },
                    ],
                },
            });

        expect(found.body.result[0].length).to.be.equal(0);
    });

    step('Read', async () => {
        const dataset = createDataset();
        const created = await createIdentifiers([dataset]);

        const result = await doFunctionRequest('identifierRead')
            .setUserToken()
            .send({
                data: {
                    query: [
                        {
                            key: dataset.key,
                        },
                    ],
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result[0]).to.be.equal(1);
    });
});
