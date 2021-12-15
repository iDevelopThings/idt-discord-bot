import CronJob from "../../Handlers/CronJob/CronJob";
import {sendSpamLogs} from "../../Util/SpamShit";

export default class SpamCalcsInfo extends CronJob {
	handlerId = 'moderation/spam-calcs-info';
	runEvery  = '6h';

	public async run() {
		await super.run();

//		await sendSpamLogs();

	}

}
