import { getDefaultStorage } from '../storage';

async function test() {
    const storage = getDefaultStorage();
    //await storage.createBucket('gamibackend_testbucket');
    const url = await storage.getSignedURL('gamibackend_testbucket', 'testfile', 'customtext', 'write');
    console.log(url);
}

test().then(() => {
    console.log('done');
}).catch((err) => {
    console.log('error');
    console.log(err.toString());
});
