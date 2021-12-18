import CronJob from "../Handlers/CronJob/CronJob";
import User from "../Models/User/User";

export default class CleanUpBalanceHistory extends CronJob {
	handlerId = 'clean-balance-history';
	runEvery  = '1h';

	public async run() {
		await super.run();

		const users = await User.get<User>();

		for (const user of users) {
			if (user.balanceHistory.length < 50) {
				continue;
			}

			user.balanceHistory = user.balanceHistory.slice(-50);

			await User.getCollection<User>().updateOne(
				{_id : user._id},
				{$set : {balanceHistory : user.balanceHistory}}
			);
		}
	}

}
