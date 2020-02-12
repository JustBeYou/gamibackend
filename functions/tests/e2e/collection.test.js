const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId} = require('../utils');

chai.use(chaiHttp);

function createCollection() {
    const result = doFunctionRequest('collectionCreate')
        .setUserToken()
        .send({
            data:
            {
                title: makeId(10),
                summary: 'sample text',
                thunmbnail: 'unimplemented',
                accessStatus: 'PUBLIC',
                modules: [
                    {
                        type: 'TEXT',
                        text: 'first module',
                    },
                    {
                        type: 'TEXT',
                        text: 'second module',
                    },
                ],
            },
        });

    return result;
}

describe('Collection CRUD API', () => {
    step('Create', async () => {
        const created = await createCollection();

        expect(created).to.have.status(200);
        expect(created.body.result.collection.summary).to.be.equal('sample text');
        expect(created.body.result.modules[0].ModuleText.text).to.be.equal('first module');
    });

    step('Search with filters', async () => {
        const created = await createCollection();

        const result = await doFunctionRequest('collectionList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        id: created.body.result.collection.id,
                    },
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result.length).to.be.equal(1);
        expect(result.body.result[0].id).to.be.equal(
            created.body.result.collection.id,
        );
    });

    step('Modify', async () => {
        const created = await createCollection();

        const result = await doFunctionRequest('collectionModify')
            .setUserToken()
            .send({
                data: {
                    id: created.body.result.collection.id,
                    update: {
                        title: 'changed title',
                    },
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result.title).to.be.equal('changed title');
    });

    step('Delete', async () => {
        const created = await createCollection();

        const result = await doFunctionRequest('collectionDelete')
            .setUserToken()
            .send({
                data: {
                    id: created.body.result.collection.id,
                },
            });

        expect(result).to.have.status(200);

        const found = await doFunctionRequest('collectionList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        id: created.body.result.collection.id,
                    },
                },
            });

        expect(found.body.result[0].inactive).to.be.equal(true);
    });

    step('Check access codes (unimplemented)');
    step('Check password access (unimplemented)');
});