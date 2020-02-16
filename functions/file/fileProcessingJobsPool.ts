import {Worker, InMemoryJobsPool, JobsPool} from '../jobsPool';
import { FileInfo } from '../models/fileInfo';

export type ProcessingJob = {
    id: number,
};

export const defaultJobsPool = new InMemoryJobsPool<ProcessingJob>();

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

            for (let i = 0; i < 10000000; i++) {
                const j = (i * 100 - 3.14) / 2;
                j;
            }

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