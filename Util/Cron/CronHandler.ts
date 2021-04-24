import {Log} from '@envuso/common';
import CronJobInformation from "../../Models/CronJobInformation";
import CronJob from './CronJob';
import path from 'path';

export interface ICron {
	handlerId: string;
	lastRun: Date | null;
}

export default class CronHandler {
	private _jobs: CronJob[] = [];
	private _tick: NodeJS.Timeout;

	async boot() {
		await this.loadCrons();

		this._tick = setInterval(this.run.bind(this), 60 * 1000);
	}

	async register(jobClass: typeof CronJob) {
		const job     = new jobClass();
		const jobInfo = await CronJobInformation.findOne<CronJobInformation>({handlerId : job.handlerId});

		if (jobInfo) {
			job.lastRun = new Date(jobInfo.lastRun);

			this._jobs.push(job);

			return;
		}

		await CronJobInformation.create<CronJobInformation>({
			handlerId : job.handlerId,
			lastRun   : job.lastRun,
		});

		this._jobs.push(job);
	}

	run() {
		for (const job of this._jobs) {
			this.processJob(job)
				.then(() => Log.info('Processed job: ' + job.handlerId))
				.catch(error => {
					Log.error('Failed to process job: ' + job.handlerId);
					console.trace(error);
				});
		}
	}

	processJob(job: CronJob) {
		if (!job.canRun()) {
			return Promise.resolve();
		}

		return job.run();
	}

	private loadCrons() {
		const cronJobs: { [key: string]: any } = require('require-all')({
			dirname   : path.join(__dirname, 'Jobs'),
			recursive : true,
			filter    : /^(.+)\.(j|t)s$/,
			resolve   : function (Handler) {
				return Handler.default;
			},
		});

		return Promise.all(this.loadCronFolder(cronJobs));
	}

	private loadCronFolder(cronFolder: any) {
		const queue = [];

		for (const cron in cronFolder) {
			if (typeof cronFolder[cron] === 'object' && !(cronFolder[cron].prototype instanceof CronJob)) {
				queue.push(...this.loadCronFolder(cronFolder[cron]));

				continue;
			}

			queue.push(this.register(cronFolder[cron])
				.then(() => Log.info('[CRON] Registered: ' + cron))
				.catch(error => {
					Log.error('[CRON] Failed to register: ' + cron);
					console.trace(error);
				}));
		}

		return queue;
	}
}
