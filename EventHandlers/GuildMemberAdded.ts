import {ClientEvents, GuildMember, PartialGuildMember, TextChannel} from "discord.js";
import User from "../Models/User/User";
import {UserInstance} from "../Models/User/UserInstance";
import {guild} from "../Util/Bot";
import {dayjs} from "../Util/Date";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MEMBER_ADD;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMemberAdded extends BaseEventHandler<ClientEventType> {

	async handle(member: GuildMember) {
		const user = await this.updateUserInformation(member);

		const introChannel = guild().channels.cache.find(c => c.name.includes('intro_channel')) as TextChannel;

		if (!introChannel) {
			return;
		}

		if (user.leftAt !== null) {
			return await introChannel.send(`${member.toString()} is back after an adventure that lasted... ${dayjs(user.leftAt).fromNow(true)}`);
		}

		await introChannel.send(`Welcome ${member.toString()}`);
	}

	private async updateUserInformation(member: GuildMember): Promise<UserInstance> {
		const user        = await User.get(member.id);
		const discordInfo = await User.getDiscordUserInformation(member.id);
		return await User.update({id : discordInfo.id}, discordInfo, true);
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
