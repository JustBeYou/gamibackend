const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId, userToken} = require('../utils');
const {Collection} = require('../../models/collection');

chai.use(chaiHttp);

function createModule(dataset) {
    return doFunctionRequest('moduleCreate')
        .setUserToken()
        .send({
            data: dataset,
        });
}

describe('Module CRUD API', () => {
    let parentCollectionId = 0;

    before(async () => {
        const created = await Collection.create({
            title: makeId(10),
            accessStatus: 'PUBLIC',
            parentToken: userToken,
        });

        parentCollectionId = created.id;
    });

    step('Create simple', async () => {
        const created = await createModule({
            CollectionId: parentCollectionId,
            type: 'TEXT',
            text: 'this is some text',
        });

        expect(created).to.have.status(200);
        expect(created.body.result.parentToken).to.be.equal(userToken);
        expect(created.body.result.ModuleText.text).to.be.equal('this is some text');
        expect(created.body.result.ModuleText.ModuleId).to.be.equal(
            created.body.result.id,
        );
    });

    step('Search with filters', async () => {
        const uniqueText = 'this will be searched ' + makeId(10);

        const created = await createModule({
            CollectionId: parentCollectionId,
            type: 'TEXT',
            text: uniqueText,
        });

        const result = await doFunctionRequest('moduleList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        type: 'TEXT',
                        text: uniqueText,
                    },
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result.length).to.be.equal(1);
        expect(result.body.result[0].ModuleText.text).to.be.equal(uniqueText);
    });

    step('Modify', async () => {
        const created = await createModule({
            CollectionId: parentCollectionId,
            type: 'TEXT',
            text: 'this is some text',
        });

        const result = await doFunctionRequest('moduleModify')
            .setUserToken()
            .send({
                data: {
                    id: created.body.result.id,
                    update: {
                        text: 'changed text',
                    },
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result.id).to.be.equal(created.body.result.id);
        expect(result.body.result.ModuleText.text).to.be.equal('changed text');
    });

    step('Delete', async () => {
        const created = await createModule({
            CollectionId: parentCollectionId,
            type: 'TEXT',
            text: 'this will be deleted',
        });

        const result = await doFunctionRequest('moduleDelete')
            .setUserToken()
            .send({
                data: {
                    id: created.body.result.id,
                },
            });

        expect(result).to.have.status(200);

        const found = await doFunctionRequest('moduleList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        id: created.body.result.id,
                    },
                },
            });

        expect(found.body.result.length).to.be.equal(1);
        expect(found.body.result[0].inactive).to.be.equal(true);
    });

    step('Associate (unimplemented)');

    step('Deassociate (unimplemented)');
});