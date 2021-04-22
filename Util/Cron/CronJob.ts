import ms from 'ms';
import {collection} from "../../Models/ModelHelper";

export default class CronJob {
	handlerId: string;
	runEvery: string     = null;
	lastRun: Date | null = null;

	public canRun() {
		if (this.handlerId === null) {
			return false;
		}

		if (this.lastRun === null) {
			return true;
		}

		return (this.lastRun.getTime() + ms(this.runEvery)) < Date.now();
	}

	public async run() {
		await collection('crons').updateOne(
			{handlerId : this.handlerId},
			{
				$set : {
					lastRun : new Date()
				}
			}
		);

		this.lastRun = new Date();
	}
}
