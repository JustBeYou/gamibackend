const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, 
    makeId, 
    userToken,
    setAnotherUserToken, 
    defaultPassword, 
    setAccessCode, 
    setDefaultPasword} = require('../utils');
const {Collection} = require('../../models/collection');
const passwordHash = require('password-hash');

chai.use(chaiHttp);

async function createAccessCode(parentCollectionId) {
    const result = await doFunctionRequest('accessCodeCreate')
        .setUserToken()
        .send({
            data: [{
                parentCollection: parentCollectionId,
                type: 'PERMANENT',
                maxUsers: 5,
            }],
        });

    return result.body.result[0];
}

function createModule(dataset) {
    return doFunctionRequest('moduleCreate')
        .setUserToken()
        .send({
            data: dataset,
        });
}

describe('Module CRUD API', () => {
    let parentCollectionId = 0;
    let temporaryCollection = null;
    let temporaryModule = null;

    before(async () => {
        const created = await Collection.create({
            title: makeId(10),
            accessStatus: 'PUBLIC',
            parentToken: userToken,
        });

        parentCollectionId = created.id;
        
        
        temporaryCollection = await Collection.create({
            title: makeId(10),
            accessStatus: 'PUBLIC',
            parentToken: userToken,
        });

        temporaryModule = (await createModule({
            CollectionId: parentCollectionId,
            type: 'TEXT',
            text: 'this is some text',
            parentToken: userToken,
        })).body.result;
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

    step('Associate', async () => {
        const result = await doFunctionRequest('moduleAssociate')
            .setUserToken()
            .send({
                data: {
                    ModuleId: temporaryModule.id,
                    CollectionId: temporaryCollection.id,
                }
            });

        expect(result).to.have.status(200);

        const childModules = await temporaryCollection.getModules();
        const filteredChildModules = childModules.filter((module) => {
            return module.id === temporaryModule.id;
        });

        expect(filteredChildModules).to.have.length(1);
    });

    step('Deassociate',  async () => {
        const result = await doFunctionRequest('moduleDeassociate')
            .setUserToken()
            .send({
                data: {
                    ModuleId: temporaryModule.id,
                }
            });
        
        expect(result).to.have.status(200);

        const childModules = await temporaryCollection.getModules();
        const filteredChildModules = childModules.filter((module) => {
            return module.id === temporaryModule.id;
        });

        expect(filteredChildModules).to.have.length(0);
    });

    step('Check access codes (display route)', async () => {
        const privateCollection = await Collection.create({
            title: makeId(10),
            accessStatus: 'PRIVATE',
            protectionType: 'ACCESS_CODE',
            parentToken: userToken,
        });
        const accessCode = await createAccessCode(privateCollection.id);

        const uniqueText = 'this will be searched ' + makeId(10);
        const created = await createModule({
            CollectionId: privateCollection.id,
            type: 'TEXT',
            text: uniqueText,
        });
        const moduleId = created.body.result.id;

        const result = await doFunctionRequest('moduleDisplay')
            .setAnotherUserToken()
            .setAccessCode(accessCode)
            .send({
                data: {
                    query: {
                        id: moduleId,
                    }
                }
            });

        expect(result).to.have.status(200);
        expect(result.body.result.id).to.be.equal(moduleId);
        expect(result.body.result.ModuleText.text).to.be.equal(uniqueText);

        const badResult = await doFunctionRequest('moduleDisplay')
            .setAnotherUserToken()
            .setAccessCode('wrong')
            .send({
                data: {
                    query: {
                        id: moduleId,
                    }
                }
            });
        expect(badResult).to.have.status(400);
    });

    step('Check password access (display route)', async () => {
        const privateCollection = await Collection.create({
            title: makeId(10),
            accessStatus: 'PRIVATE',
            protectionType: 'PASSWORD',
            password: passwordHash.generate(defaultPassword),
            parentToken: userToken,
        });

        const uniqueText = 'this will be searched ' + makeId(10);
        const created = await createModule({
            CollectionId: privateCollection.id,
            type: 'TEXT',
            text: uniqueText,
        });
        const moduleId = created.body.result.id;

        const result = await doFunctionRequest('moduleDisplay')
            .setAnotherUserToken()
            .setDefaultPasword()
            .send({
                data: {
                    query: {
                        id: moduleId,
                    }
                }
            });

        expect(result).to.have.status(200);
        expect(result.body.result.id).to.be.equal(moduleId);
        expect(result.body.result.ModuleText.text).to.be.equal(uniqueText);

        const badResult = await doFunctionRequest('moduleDisplay')
            .setAnotherUserToken()
            .setAccessCode('wrong')
            .send({
                data: {
                    query: {
                        id: moduleId,
                    }
                }
            });
        expect(badResult).to.have.status(400);
    });
});