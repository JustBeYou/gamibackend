import {Worker, InMemoryJobsPool, JobsPool} from '../jobsPool';
import { FileInfo } from '../models/fileInfo';

export type ProcessingJob = {
    id: number,
};

export const defaultJobsPool = new InMemoryJobsPool<ProcessingJob>();

const Compute = require('@google-cloud/compute');
export class GoogleCloudWorker implements Worker {
    private api: any;

    constructor(jobsPool: JobsPool<ProcessingJob>) {
        const compute = new Compute({
            projectId: 'gamibackend',
            keyFilename: './serviceAccountKey.json',
        });
        const zone = compute.zone('us-central1-c'); // TODO: change zone based on storage!!!
        this.api = zone;
        this.api;
    }

    public async applyStrategy() {

        return Promise.resolve();
    }

    public async startNewInstance() {

        return Promise.resolve();
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
        if (this._isRunning === false && await this.jobsPool.count() >= 5) {
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

export const defaultWoker = new FakeWorker(defaultJobsPool);