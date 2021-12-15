import {Log} from "@envuso/common";
import {ClientEvents, Message, TextChannel} from "discord.js";
import SentMessage from "../Models/SentMessage";
import User from "../Models/User/User";
import {StatisticsKeys} from "../Models/User/UserInformationInterfaces";
import {getNewSpamInflictedXp} from "../Util/SpamShit";
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

		const [xp, calcs] = await getNewSpamInflictedXp(30, user);

		user.updateStatistic(StatisticsKeys.ACTIVITY_MESSAGES_SENT);
		user.skillManager().addXp("chatting", xp);
		user.queuedBuilder().set({spamInfo : calcs});
		await user.executeQueued();

		SentMessage.storeInfo(message).catch(error => Log.error(error));
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
