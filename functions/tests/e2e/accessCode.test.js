const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId} = require('../utils');

chai.use(chaiHttp);

let parentCollectionId;

function createAccessCode() {
    return doFunctionRequest('accessCodeCreate')
        .setUserToken()
        .send({
            data: [{
                parentCollection: parentCollectionId,
                type: 'INACTIVE',
            }],
        });
}

describe('Access Code CRUD API', () => {
    before(async () => {
        const created = await doFunctionRequest('collectionCreate')
            .setUserToken()
            .send({
                data: {
                    title: makeId(10),
                    summary: 'sample text',
                    thumbnail: 'not implemented',
                    accessStatus: 'PUBLIC',
                },
            });

        parentCollectionId = created.body.result.collection.id;
    });

    // TODO: re-enable this after mocking firebase
    step('Create', async () => {
        const result = await createAccessCode();
        expect(result).to.have.status(200);
    });

    step('Validate (maybe not necessary)');

    step('Search with filters', async () => {
        const created = await createAccessCode();

        const result = await doFunctionRequest('accessCodeList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        id: parentCollectionId,
                    },
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result).to.satisfy((codesList) => {
            return codesList.some((code) => {
                return code.id == created.body.result;
            });
        });
    });

    step('Modify', async () => {
        const created = await createAccessCode();

        const result = await doFunctionRequest('accessCodeModify')
            .setUserToken()
            .send({
                data: [
                    {
                        code: created.body.result[0],
                        update: {
                            maxUsers: 1337,
                        },
                    },
                ],
            });

        // TODO: accessCode tests are not good enough
        expect(result).to.have.status(200);
    });
    step('Delete');
    step('Delete all');
    step('Generate');
});