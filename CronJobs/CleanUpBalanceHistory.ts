import CronJob from "../Handlers/CronJob/CronJob";
import User from "../Models/User/User";

export default class CleanUpBalanceHistory extends CronJob {
	handlerId = 'clean-balance-history';
	runEvery  = '1h';

	public async run() {
		await super.run();

		const users = await User.get<User>();

		for (const user of users) {
			await user.balanceManager().cleanHistory();
		}
	}

}
