const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId} = require('../utils');
const axios = require('axios');
const {getDefaultBucket, getDefaultStorage} = require('../../storage');
const {FileInfo} = require('../../models/fileInfo');

chai.use(chaiHttp);

let testBucket = null;
let randomFileName = null;
const randomContent = makeId(100);
describe('File management API', () => {
    before(async () => {
        testBucket = getDefaultBucket();
        const alreadyExists = await getDefaultStorage().checkBucketExists(testBucket);
        if (!alreadyExists) {
            await getDefaultStorage().createBucket(testBucket);
        }
    });

    step('Upload file', async () => {
        const result = await doFunctionRequest('fileUpload')
            .setUserToken()
            .send({
                data: {
                    filename: 'testfile',
                    type: 'text',
                }
            });
        expect(result).to.have.status(200);
        
        const url = result.body.result.url;
        randomFileName = result.body.result.file;
        const response = await axios.post(url, '', {
            headers: {
                'Content-Type': 'text',
                'X-Goog-Resumable': 'start',
            }
        });

        const location = response.headers.location;
        await axios.put(location, randomContent, {
            headers: {
                'Content-Type': 'text',
            }
        });

        const exists = await getDefaultStorage().checkFileExists(testBucket, randomFileName);
        expect(exists).to.be.true;
    });

    step('Download file', async () => {
        const result = await doFunctionRequest('fileDownload')
            .setUserToken()
            .send({
                data: {
                    filename: randomFileName,
                    type: 'text',
                }
            });
        expect(result).to.have.status(200);

        const url = result.body.result.url;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'text',
            }
        });
        
        expect(response.data).to.be.equal(randomContent);
    });

    step('Search with filters', async () => {
        const result = await doFunctionRequest('fileList')
            .setUserToken()
            .send({
                data: {
                    query: [
                        {
                            filename: randomFileName,
                        },
                    ]
                }   
            });

        expect(result).to.have.status(200);
        expect(result.body.result.length).to.be.equal(1);
        expect(result.body.result[0][0].filename).to.be.equal(randomFileName);
        expect(result.body.result[0][0].originalFilename).to.be.equal('testfile');
    });

    step('Check file status', async () => {
        const result = await doFunctionRequest('fileStatus')
            .setUserToken()
            .send({
                data: {
                    filename: randomFileName,
                },
            });

        expect(result).to.have.status(200);
        expect(result.body.result.status).to.be.equal('PROCESSED');
    });
    
    step('Mark file as deleted', async () => {
        const result = await doFunctionRequest('fileDelete')
            .setUserToken()
            .send({
                data: {
                    filename: randomFileName,
                }
            });

        expect(result).to.have.status(200);
    });
});