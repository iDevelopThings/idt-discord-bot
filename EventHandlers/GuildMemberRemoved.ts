import {ClientEvents, GuildMember, PartialGuildMember, TextChannel} from "discord.js";
import User from "../Models/User/User";
import {guild} from "../Util/Bot";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";


const ClientEvent = ClientEventsTypes.GUILD_MEMBER_REMOVE;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMemberRemoved extends BaseEventHandler<'guildMemberRemove'> {

	async handle(member: GuildMember | PartialGuildMember) {
		await User.update(
			{id : member.id},
			{
				$currentDate : {
					leftAt : true
				}
			},
			false
		);
		const introChannel = guild().channels.cache.find(c => c.name.includes('intro_channel')) as TextChannel;

		if (!introChannel) {
			return;
		}

		await introChannel.send(`${member.toString()} has left the server.`)

	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
