import {ClientEvents, GuildMember, Message, PartialGuildMember} from "discord.js";
import User from "../Models/User/User";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MESSAGE_SENT;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMessageSent extends BaseEventHandler<ClientEventType> {

	async handle(message: Message) {
		const user = await User.get(message.author.id);

		if (user) {
			user.statistics.activity.messagesSent++;
			await user.skillManager().addXp("chatting", 30, false);
			await user.save();
		}
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
