import { Worker, JobsPool, FirestoreJobsPool } from '../jobsPool';
import { FileInfo } from '../models/fileInfo';
import { uuid } from 'uuidv4';


export type ProcessingJob = {
    id: number,
};

export const defaultJobsPool = new FirestoreJobsPool<ProcessingJob>();

const Compute = require('@google-cloud/compute');
export class GoogleCloudWorker implements Worker {
    private connectionString: string;
    private api: any;
    private startupScript = `\
#!/usr/bin/python3
from os import system

#TODO: remove this, DEBUG only
import http.client

def request_check(s):
    conn = http.client.HTTPSConnection('enta03yorpkt.x.pipedream.net')
    conn.request("POST", "/", '{ "content": %s }' % (s), {'Content-Type': 'application/json'})

print("Installing software...")
system("sudo apt update && sudo apt install -y ffmpeg python3-pip")
system("python3 -m pip install --upgrade firebase-admin")
print("Done!")

#request_check('installed software')

connectionString = u"{CONNECTION_STRING}"
print("Jobs queue at {}".format(connectionString))

serviceType, pathName = connectionString.split(':')
assert serviceType == u'firestore', 'Only firestore is supported at the moment.'

from base64 import b64decode
serviceAccountKey = b64decode("{SERVICE_ACCOUNT_KEY}")

with open('/tmp/serviceAccountKey.json', 'wb') as f:
    f.write(serviceAccountKey)
    f.flush()

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

#request_check('imported firebase')

# Use the application default credentials
cred = credentials.Certificate('/tmp/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

print ("Processing jobs")

queue = firestore.client().collection(pathName)
for job in queue.get():
    print (job)

print ("Done.")

#request_check('iterated over jobs')

system("gcloud auth activate-service-account --key-file=/tmp/serviceAccountKey.json && \
        export NAME=$(curl -X GET http://metadata.google.internal/computeMetadata/v1/instance/name -H 'Metadata-Flavor: Google') && \
        export ZONE=$(curl -X GET http://metadata.google.internal/computeMetadata/v1/instance/zone -H 'Metadata-Flavor: Google') && \
        gcloud --quiet compute instances delete $NAME --zone=$ZONE")
`;

    constructor(jobsPool: JobsPool<ProcessingJob>) {
        const compute = new Compute({
            projectId: 'gamibackend',
            keyFilename: './serviceAccountKey.json',
        });
        const zone = compute.zone('us-central1-c'); // TODO: change zone based on storage!!!
        this.api = zone;
        this.connectionString = jobsPool.getConnectionString();
    }

    public async applyStrategy() {
        await this.startNewInstance();
        return Promise.resolve();
    }

    

    public async startNewInstance() {
        try {
            await this.createInstance();
        } catch (error) {
            if (error.toString().indexOf('already exists') > -1) {
                console.log('No need to start a new instance.');
            } else {
                throw new Error('Could not create the instance: ' + error.toString());
            }
        }

        return Promise.resolve();
    }
    
    private async createInstance() {
        const [vm, operation] = await this.api.createVM('fileprocessing' + uuid(), {
            os: 'debian',
            http: true,
            https: true,
            scheduling: {
                onHostMaintenance: 'TERMINATE',
                automaticRestart: false,
                preemptible: true,
            },
        });
        await operation.promise();
        this.api;
        const serviceAccountKey = require('../serviceAccountKey.json');
        const metadata = {
            'startup-script': this.startupScript
                .replace(
                    '{CONNECTION_STRING}',
                    this.connectionString,
                ).replace(
                    '{SERVICE_ACCOUNT_KEY}',
                    Buffer.from(JSON.stringify(serviceAccountKey).replace('\n', '').replace('\t', '')).toString('base64'),
                ),
        };

        await vm.setMetadata(metadata);
        await vm.reset();
    }

    public async isRunning() {
        return Promise.resolve(false);
    }
}

export class FakeWorker implements Worker {
    private _isRunning: boolean;
    private jobsPool: JobsPool<ProcessingJob>;

    constructor(jobsPool: JobsPool<ProcessingJob>) {
        this._isRunning = false;
        this.jobsPool = jobsPool;
    }

    public async applyStrategy() {
        if (this._isRunning === false && await this.jobsPool.count() >= 4) {
            this.startNewInstance()
                .then(() => {
                    //console.log("Instance shutting down...");
                })
                .catch((err) => {
                    //console.log("Instance crashed... " + err.toString());
                });
        } 

        return Promise.resolve();
    }

    public async startNewInstance() {
        //console.log('Instance started...');
        this._isRunning = true;

        while (await this.jobsPool.isEmpty() === false) {
            const job = await this.jobsPool.extract();
            //console.log("Processing ", job);

            await FileInfo.update({
                status: 'PROCESSED',
            }, {
                where: {
                    id: job.id,
                }
            });

            this._isRunning = false;
            //console.log('Done.');
        }

        return Promise.resolve();
    }

    public isRunning() {
        return Promise.resolve(this._isRunning);
    }
}

let defaultWorker: Worker = new GoogleCloudWorker(defaultJobsPool);

export function getDefaultWorker() {
    return defaultWorker;
}

export function enableTestingWorker() {
    defaultWorker = new FakeWorker(defaultJobsPool);
}