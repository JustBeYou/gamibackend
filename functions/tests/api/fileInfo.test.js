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

async function uploadFile(type) {
    const result = await doFunctionRequest('fileUpload')
        .setUserToken()
        .send({
            data: {
                filename: 'testfile',
                type: type,
            }
        });
    expect(result).to.have.status(200);

    const url = result.body.result.url;
    const response = await axios.post(url, '', {
        headers: {
            'Content-Type': type,
            'X-Goog-Resumable': 'start',
        }
    });

    const location = response.headers.location;
    await axios.put(location, randomContent, {
        headers: {
            'Content-Type': type,
        }
    });

    return result.body.result.file;
}

describe('File management API', () => {
    before(async () => {
        testBucket = getDefaultBucket();
        const alreadyExists = await getDefaultStorage().checkBucketExists(testBucket);
        if (!alreadyExists) {
            await getDefaultStorage().createBucket(testBucket);
        }
    });

    step('Upload file', async () => {
        randomFileName = await uploadFile('text');

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

    step('Associate (unimplemented)');
    step('Deassociate (unimplemented)');

    step('Process file', async () => {
        const filenames = [];

        for (let i = 0; i < 5; i++) {
            const filename1 = await uploadFile('image');
            const filename2 = await uploadFile('video');

            filenames.push(filename1);
            filenames.push(filename2);
        }

        for (const filename of filenames) {
            const file = await FileInfo.findOne({
                where: {
                    filename: filename,
                }
            });

            expect(file.status).to.be.equal('PROCESSED');
        }
    });
});