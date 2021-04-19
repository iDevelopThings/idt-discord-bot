import {ClientEvents, GuildMember, PartialGuildMember} from "discord.js";
import User from "../Models/User/User";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MEMBER_UPDATE;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMemberUpdated extends BaseEventHandler<ClientEventType> {

	async handle(oldMember: GuildMember | PartialGuildMember, member: GuildMember | PartialGuildMember) {
		const discordInfo = await User.getDiscordUserInformation(member.id);

		await User.update({id : discordInfo.id}, discordInfo);
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
