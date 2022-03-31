import {ClientEvents, GuildMember, TextChannel} from "discord.js";
import User from "../Models/User/User";
import UserManager from "../Models/User/UserManager";
import {guild} from "../Util/Bot";
import BaseEventHandler, {ClientEventsTypes} from "./BaseEventHandler";

const ClientEvent = ClientEventsTypes.GUILD_MEMBER_ADD;
type ClientEventType = typeof ClientEvent;
type ClientEventsType = ClientEvents[ClientEventType];

export default class GuildMemberAdded extends BaseEventHandler<ClientEventType> {

	async handle(member: GuildMember) {
		const user = await this.updateUserInformation(member);

//		const introChannel = guild().channels.cache.find(c => c.name.includes('intro_channel')) as TextChannel;
//
//		if (!introChannel) {
//			return;
//		}
//
//		await introChannel.send(`Welcome ${member.toString()}`);
	}

	private async updateUserInformation(member: GuildMember) {
		const user        = await User.getOrCreate(member.id);
		const discordInfo = await UserManager.getDiscordUserInformation(member.id);

		await User.where<User>({id : discordInfo.id}).update({$set : discordInfo});
	}

	getEventName(): ClientEventType {
		return ClientEvent;
	}

}
