import {ClientEvents, Message} from "discord.js";
import User from "../Models/User/User";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MESSAGE_SENT;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMessageSent extends BaseEventHandler<ClientEventType> {

	async handle(message: Message) {
		const user = await User.getOrCreate(message.author.id);


		if (!user) {
			return;
		}

		//Ehhh, we modify the data first without saving it...
		user.statistics.activity.messagesSent++;
		await user.skillManager().addXp("chatting", 30, false);

		// Now we'll issue a specific update, so we don't overwrite other values.
		await User.where<User>({id : message.author.id})
			.update({
				$set : {
					'statistics.activity.messagesSent' : 1,
					'skills.chatting.xp'               : user.skills.chatting.xp,
					'skills.chatting.level'            : user.skills.chatting.level,
				}
			});
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
