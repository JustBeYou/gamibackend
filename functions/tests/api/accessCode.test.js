const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId} = require('../utils');
const {firestore} = require('../../database');

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

    step('Create', async () => {
        const result = await createAccessCode();

        expect(result).to.have.status(200);

        const accessCodeName = result.body.result[0];
        const accessCodeObject = await firestore.collection('accessCodes').doc(accessCodeName).get();
        expect(accessCodeObject.exists).to.be.true;
    });
    
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

        expect(result).to.have.status(200);
        
        const accessCodeName = created.body.result[0];
        const accessCodeObject = await firestore.collection('accessCodes').doc(accessCodeName).get();
        const acessCodeData = accessCodeObject.data();
        expect(acessCodeData.maxUsers).to.be.equal(1337);
    });

    step('Delete', async () => {
        const created = await createAccessCode();
        const accessCodeName = created.body.result[0];

        const result = await doFunctionRequest('accessCodeDelete')
            .setUserToken()
            .send({
                data: {
                    code: accessCodeName,
                }
            });
        expect(result).to.have.status(200);

        const accessCodeObject = await firestore.collection('accessCodes').doc(accessCodeName).get();
        const accessCodeData = accessCodeObject.data();
        expect(accessCodeData.type).to.be.equal('INACTIVE');
    });

    step('Delete all', async () => {
        const result = await doFunctionRequest('accessCodeDeleteAll')
            .setUserToken()
            .send({
                data: {
                    CollectionId: parentCollectionId,
                }
            });
        expect(result).to.have.status(200);

        const found = await doFunctionRequest('accessCodeList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        id: parentCollectionId,
                    },
                },
            });
        expect(found.body.result).to.have.length(0);
    });

    step('Generate', async () => {
        const result = await doFunctionRequest('accessCodeGenerate')
            .setUserToken()
            .send({
                data: [
                    {
                        count: 10,
                        parentCollection: parentCollectionId,
                        type: 'PERMANENT',
                    }
                ]
            });
        expect(result).to.have.status(200);
        expect(result.body.result[0]).to.have.length(10);

        const found = await doFunctionRequest('accessCodeList')
            .setUserToken()
            .send({
                data: {
                    query: {
                        id: parentCollectionId,
                    },
                },
            });

        expect(found.body.result).to.have.length(10);
        expect(found.body.result).to.satisfy((codesList) => {
            return codesList.some((code) => {
                return code.type == 'PERMANENT';
            });
        });
    });
});