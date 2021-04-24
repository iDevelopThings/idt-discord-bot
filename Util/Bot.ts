import {Guild, TextChannel} from "discord.js";
import DiscordJsManager from "../Core/Discord/DiscordJsManager";

export const guildId = process.env.GUILD_ID;
export const guild   = (): Guild => DiscordJsManager.client().guilds.cache.get(guildId);


export const getGambleChannel = (): TextChannel => {
	return DiscordJsManager.client().channels.cache.find((c: TextChannel) => {
		return c.isText() && c?.name === 'gambling';
	}) as TextChannel;
};

export const getChannel = (channel: string): TextChannel => {
	return DiscordJsManager.client().channels.cache.find(
		(c: TextChannel) => c.isText() && c.name.toLowerCase() === channel.toLowerCase()
	) as TextChannel;
};


export const findInManager = <T>(
	cache: (keyof Guild),
	value: string,
	key?: keyof T | "name"
): T => {
	key                = key ?? 'name';
	const manager: any = guild()[cache];

	const cached = manager.cache.find((c: any) => c[key] === value);

	return cached;
};
