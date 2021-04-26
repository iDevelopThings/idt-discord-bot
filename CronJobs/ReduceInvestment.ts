import {FilterQuery} from "mongodb";
import CronJob from "../Handlers/CronJob/CronJob";
import User from "../Models/User/User";
import {percentOf} from "../Util/Formatter";

export default class ReduceInvestment extends CronJob {
	handlerId = 'reduce-investment';
	runEvery  = '1h';

	public async run() {
		await super.run();

		const users = await User.get<User>(this.buildFilter());

		for (let user of users) {
			const amount = percentOf(user.balances.invested, '1%');

			user.balanceManager().deductFromBalance(amount, 'Loss on investments due to market changes...', 'invested');
			await user.executeQueued();
		}

	}

	private buildFilter() {
		const filter: FilterQuery<User | { _id: any }> = {
			'balances.invested' : {
				$gt : 0
			}
		};

		return filter;
	}
}
