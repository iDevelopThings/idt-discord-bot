import {Log} from "@envuso/common";
import {ClientEvents, Message} from "discord.js";
import {MysteryBox} from "../Handlers/MysteryBox";
import SentMessage from "../Models/SentMessage";
import User from "../Models/User/User";
import {StatisticsKeys} from "../Models/User/UserInformationInterfaces";
import {getNewSpamInflictedXp, shouldReduceXp} from "../Util/SpamShit";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MESSAGE_SENT;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMessageSent extends BaseEventHandler<ClientEventType> {

	async handle(message: Message) {
		if (message.author.bot) {
			return;
		}

		const user = await User.getOrCreate(message.author.id);
		if (!user) {
			return;
		}

		this.giveMessagingXp(user).catch(error => Log.error(error));
		//this.giveRandomBoxIfPossible(user, message).catch(error => Log.error(error));

		SentMessage.storeInfo(message).catch(error => Log.error(error));
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

	private async giveMessagingXp(user: User) {
		const xp           = await shouldReduceXp(user) ? 1 : 30;
		const [xpp, calcs] = await getNewSpamInflictedXp(30, user);

		user.updateStatistic(StatisticsKeys.ACTIVITY_MESSAGES_SENT);
		user.skillManager().addXp("chatting", xp);
		user.queuedBuilder().set({spamInfo : calcs});
		await user.executeQueued();
	}

	private async giveRandomBoxIfPossible(user: User, message: Message) {
		const [can, box] = MysteryBox.canReceive(user);

		if(!can) {
			return;
		}

		await MysteryBox.give(user, box);
		await MysteryBox.sendEmbed(user, message.channel.id, new box())
	}
}
