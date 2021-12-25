import {Log} from "@envuso/common";
import * as Discord from 'discord.js';

let instance = null;

export default class DiscordJsManager {

	private _client: Discord.Client;

	static get(): DiscordJsManager {
		if (instance) return instance;

		instance = new this();

		return instance;
	}

	boot() {
		this._client = new Discord.Client({
			intents : [
				'GUILDS',
				'GUILD_MEMBERS',
				'GUILD_EMOJIS_AND_STICKERS',
				'GUILD_WEBHOOKS',
				'GUILD_PRESENCES',
				'GUILD_MESSAGES',
				'GUILD_MESSAGE_REACTIONS',
				'GUILD_MESSAGE_TYPING',
				'DIRECT_MESSAGES',
				'DIRECT_MESSAGE_REACTIONS',
				'DIRECT_MESSAGE_TYPING',
			]
		});
	}

	async run() {
		await this._client.login(process.env.BOT_TOKEN);

		this._client.on('error', error => {
			Log.error('Error from discord.js: ' + error.toString());
			console.trace(error);
		});
	}

	static client(): Discord.Client {
		return this.get()._client;
	}

}
