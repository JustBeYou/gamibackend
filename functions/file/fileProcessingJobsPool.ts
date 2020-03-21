import { Worker, JobsPool, FirestoreJobsPool, InMemoryJobsPool } from '../jobsPool';
import { FileInfo } from '../models/fileInfo';


export type ProcessingJob = {
    id: number,
    type: string,
    filename: string,
    originalFilename: string,
    targetResolution: number,
    targetOrientation: string,
};

export let defaultJobsPool: JobsPool<ProcessingJob> = new FirestoreJobsPool<ProcessingJob>();

const Compute = require('@google-cloud/compute');
export class GoogleCloudWorker implements Worker {
    private connectionString: string;
    private api: any;
    private startupScript = `\
#!/usr/bin/python3
from os import system

#TODO: remove this, DEBUG only
import http.client

#def request_check(s):
#    conn = http.client.HTTPSConnection('enoo5wj7inie.x.pipedream.net')
#    conn.request("POST", "/", '{ "content": %s }' % (s), {'Content-Type': 'application/json'})

print("Installing software...")
system("sudo apt-get update && sudo apt-get install -y ffmpeg python3-pip")
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

    pathName = 'queue'

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import storage
from requests import post

cred = credentials.Certificate('/tmp/serviceAccountKey.json')
firebase_admin.initialize_app(cred)

queue = firestore.client().collection(pathName)
url = 'https://us-central1-gamibackend.cloudfunctions.net/fileFinish'
bucket = storage.bucket('gamibackend_files')

#request_check('connected')

def report_finished_processing(id):
    post(url, headers = {'token': 'vm_token'}, json = {'data': {'id': id}})

def process_file(filename, type, targetFilename):
    input_filename = 'processing_' + filename
    
    blob = bucket.get_blob(filename)
    blob.download_to_filename(input_filename)

    transform(input_filename, type, targetFilename)

    # Bug: content_type must be some known mime type
    targetBlob = bucket.blob(targetFilename)
    targetBlob.upload_from_filename(targetFilename, content_type = 'text/plain')

import subprocess
import re
import os

def transform(filename, type, targetFilename):
    if type in transformations:
        return transformations[type](filename, targetFilename)
    else:
        raise Exception("Unimplemented for type {}".format(type))

def get_real_resolution(input_filename):
    output = subprocess.check_output("ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x {}".format(input_filename), shell = True)
    width, height = [int(x) for x in output.split(b'x') if x != b'']
    orientation = 'landscape' if width > height else 'portrait'    
    return width, height, orientation

def get_desired_resolution(targetFilename):
    l = targetFilename.split('.')[:-1]
    l = ''.join(l).split('_')
    if l[-1] in ['landscape', 'portrait']:
        return int(l[-2]), l[-1]
    return int(l[-1]), None

def transform_video(input_filename, targetFilename):
    if type(input_filename) == bytes:
        input_filename = input_filename.decode('ascii')
    if type(targetFilename) == bytes:
        targetFilename = targetFilename.decode('ascii')
    
    print ('Processing {}'.format(input_filename))
    width, height, orientation = get_real_resolution(input_filename)
    print ("Real resolution: {}x{} {}".format(width, height, orientation))
    desiredResolution, _ = get_desired_resolution(targetFilename)
    print ("Desired {}p".format(desiredResolution))

    os.system('ffmpeg -i {} -vf scale=-1:{} {}'.format(input_filename, desiredResolution, targetFilename))

def transform_image(input_filename, targetFilename):
    if type(input_filename) == bytes:
        input_filename = input_filename.decode('ascii')
    if type(targetFilename) == bytes:
        targetFilename = targetFilename.decode('ascii')

    print ('Processing {}'.format(input_filename))
    width, height, orientation = get_real_resolution(input_filename)
    print ("Real resolution: {}x{} {}".format(width, height, orientation))
    desiredResolution, desiredOrientation = get_desired_resolution(targetFilename)
    print ("Desired {}p {}".format(desiredResolution, desiredOrientation))

    if orientation == 'landscape':
        if orientation == desiredOrientation:
            scale = "-1:{}".format(desiredResolution)
        else:
            scale = "{}:-1".format(desiredResolution)

    elif orientation == 'portrait':
        if orientation == desiredOrientation:
            scale = "{}:-1".format(desiredResolution)
        else:
            scale = "{}:-1".format(desiredResolution)

    os.system('ffmpeg -i {} -vf scale={} {}'.format(input_filename, scale, targetFilename))

transformations = {
    'image': transform_image,
    'video': transform_video,
}

#request_check('getting files')

while True:
    try:
        snapshot = next(queue.limit(1).get())
    except:
        break

    data = snapshot.to_dict()
    process_file(data['originalFilename'], data['type'], data['filename'])
    report_finished_processing(data['id'])
    queue.document(snapshot.id).delete()

#request_check('done processing')

system('sudo shutdown -h now')
`;
    private shutdownScript = `
#!/usr/bin/python3

from os import system

print ("shut down...")
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
        const [vm, operation] = await this.api.createVM('fileprocessing', {
            machineType: 'n1-standard-4',
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
            'shutdown-script': this.shutdownScript,
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
        if (this._isRunning === false && await this.jobsPool.count() > 0) {
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
    defaultJobsPool = new InMemoryJobsPool<ProcessingJob>();
    defaultWorker = new FakeWorker(defaultJobsPool);
}