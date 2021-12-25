import {Log} from "@envuso/common";
import {ClientEvents} from "discord.js";
import DiscordJsManager from "../Core/Discord/DiscordJsManager";

export enum ClientEventsTypes {
	GUILD_MEMBER_ADD             = 'guildMemberAdd',
	GUILD_MEMBER_REMOVE          = 'guildMemberRemove',
	GUILD_MEMBER_UPDATE          = 'guildMemberUpdate',
	GUILD_MEMBER_PRESENCE_UPDATE = 'presenceUpdate',
	GUILD_MESSAGE_SENT           = 'messageCreate',
}

export default abstract class BaseEventHandler<K extends keyof ClientEvents> {

	abstract handle(...args: ClientEvents[K]);

	abstract getEventName(): K;

	public bindListener() {
		DiscordJsManager.client().on(this.getEventName() as string, (...args: ClientEvents[K]) => {
			this.handle(...args).catch(error => {
				Log.error(error.toString());
				console.trace(error);
			});
		});

		Log.info(`EventHandler bound for: ${this.getEventName()}|${this.constructor.name}`);
	}
}
