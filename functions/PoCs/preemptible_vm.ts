const Compute = require('@google-cloud/compute');

async function main() {
    const compute = new Compute({
        projectId: 'gamibackend',
        keyFilename: './serviceAccountKey.json',
    });
    const zone = compute.zone('us-central1-c');

    const [vm, operation] = await zone.createVM('testvm', {
        os: 'debian',
        //http: true,
        //https: true,
        scheduling: {
            preemptible: true,
        }, 
    });

    console.log(vm);
    await operation.promise();
    console.log('created');
}