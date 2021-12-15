import {ClientEvents, Message} from "discord.js";
import User from "../Models/User/User";
import {StatisticsKeys} from "../Models/User/UserInformationInterfaces";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MESSAGE_SENT;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMessageSent extends BaseEventHandler<ClientEventType> {

	async handle(message: Message) {
		if(message.author.bot) {
			return;
		}

		const user = await User.getOrCreate(message.author.id);
		if (!user) {
			return;
		}

		user.updateStatistic(StatisticsKeys.ACTIVITY_MESSAGES_SENT);
		user.skillManager().addXp("chatting", 30);
		await user.executeQueued();

	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
