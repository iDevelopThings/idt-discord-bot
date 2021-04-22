import {Log} from "@envuso/common";
import {collection} from "../../Models/ModelHelper";
import CronJob from "./CronJob";

export interface ICron {
	handlerId: string;
	runEvery: string;
	lastRun: Date | null;
}

export default class CronHandler {

	private _jobs: CronJob[] = [];
	private _tick: NodeJS.Timeout;

	boot() {
		//		const crons = await collection<ICron>('crons').find().toArray();
		//
		//		for (const cron of crons) {
		//			switch (cron.handlerId) {
		//				case 'bot-claim-investment':
		//					this._jobs.push(new BotClaimInvestment());
		//					break;
		//			}
		//		}

		this._tick = setInterval(this.run.bind(this), 60 * 1000);
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

	async register(jobClass: typeof CronJob) {

		const job = new jobClass();

		const jobInfo = await collection<ICron>('crons').findOne({handlerId : job.handlerId});
		if (jobInfo) {
			job.handlerId = jobInfo.handlerId;
			job.runEvery  = jobInfo.runEvery;
			job.lastRun   = jobInfo.lastRun;

			this._jobs.push(job);

			return;
		}

		await collection<ICron>('crons').insertOne({
			handlerId : job.handlerId,
			runEvery  : job.runEvery,
			lastRun   : job.lastRun
		});

		this._jobs.push(job);
	}

}
