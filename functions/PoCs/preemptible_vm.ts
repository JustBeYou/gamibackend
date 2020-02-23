const Compute = require('@google-cloud/compute');

async function main() {
    const compute = new Compute({
        projectId: 'gamibackend',
        keyFilename: '../serviceAccountKey.json',
    });
    const zone = compute.zone('us-central1-c');

    const [vm, operation] = await zone.createVM('fileprocessing', {
        os: 'debian',
        http: true,
        https: true,
        scheduling: {
            onHostMaintenance: 'TERMINATE',
            automaticRestart: false,
            preemptible: true,
        },

        metadata: {
            items: [
                {
                    key: 'startup-script',
                    value: '#!/bin/sh\n\nsudo apt update\nsudo apt install -y python ffmpeg',
                },
            ],
        kind: 'compute#metadata',
        },
    });

    console.log(vm);
    await operation.promise();
    console.log('created');
}

main()
    .then()
    .catch();