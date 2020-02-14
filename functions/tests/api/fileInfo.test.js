const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const {doFunctionRequest, makeId} = require('../utils');
const axios = require('axios');
const {getDefaultStorage} = require('../../storage');
const {FileInfo} = require('../../models/fileInfo');

chai.use(chaiHttp);

const testBucket = 'gamibackend_testbucket';
const randomFileName = makeId(10);
const randomContent = makeId(100);
describe('File management API', () => {
    before(async () => {
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
                    bucket: testBucket,
                    file: randomFileName,
                    type: 'text',
                }
            });
        
        const url = result.body.result;
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
                    bucket: testBucket,
                    file: randomFileName,
                    type: 'text',
                }
            });

        const url = result.body.result;
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'text',
            }
        });
        
        expect(response.data).to.be.equal(randomContent);
    });

    step('Check file status', async () => {
        const file = await FileInfo.findOne({
            where: {
                originalFilename: randomFileName,
            },
        });

        expect(file).to.not.be.null;
        expect(file).to.not.be.undefined;
        expect(file.status).to.be.equal('PROCESSED');
    });
    step('Search files with filters');
    step('Mark file as deleted');
});