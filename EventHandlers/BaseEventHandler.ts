import {Log} from "@envuso/common";
import {ClientEvents, Constants} from "discord.js";
import {client} from "../index";


export enum ClientEventsTypes {
	GUILD_MEMBER_ADD             = 'guildMemberAdd',
	GUILD_MEMBER_REMOVE          = 'guildMemberRemove',
	GUILD_MEMBER_UPDATE          = 'guildMemberUpdate',
	GUILD_MEMBER_PRESENCE_UPDATE = 'presenceUpdate',
}

export default abstract class BaseEventHandler<K extends keyof ClientEvents> {

	abstract handle(...args: ClientEvents[K]);

	abstract getEventName(): K;

	public bindListener() {
		client.on(this.getEventName() as string, (...args: ClientEvents[K]) => {
			this.handle(...args)
				.then(() => Log.info(`Handled event ${this.getEventName()}`))
				.catch(error => {
					Log.error(error.toString());
					console.trace(error);
				});
		});

		Log.info(`EventHandler bound for: ${this.getEventName()}|${this.constructor.name}`);
	}
}
