import DiscordJsManager from "../Core/Discord/DiscordJsManager";
import User from "../Models/User/User";
import CronJob from "../Handlers/CronJob/CronJob";

export default class BotClaimInvestment extends CronJob {

	handlerId = 'bot-claim-investment';
	runEvery  = '30m';

	public async run() {
		await super.run();

		const botUser = await User.getOrCreate(DiscordJsManager.client().user.id);

		await botUser.balanceManager().claimInvestment();
	}


}
