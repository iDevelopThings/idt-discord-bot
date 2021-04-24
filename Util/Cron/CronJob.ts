import ms from 'ms';
import CronJobInformation from "../../Models/CronJobInformation";

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
		const cron = await CronJobInformation
			.where<CronJobInformation>({handlerId : this.handlerId})
			.first() as CronJobInformation;

		cron.lastRun = new Date();
		await cron.save();

		this.lastRun = new Date();
	}
}
