import {Guild, GuildMember, MessageEmbed, MessageOptions, TextChannel} from "discord.js";
import DiscordJsManager from "../Core/Discord/DiscordJsManager";

export const guildId = process.env.GUILD_ID;
export const guild   = (): Guild => DiscordJsManager.client().guilds.cache.get(guildId);

export const getGuildMember = (id: string): GuildMember => {
	return guild().members.cache.get(id);
};

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

export const sendEmbedInChannel = (channel: string, embed: MessageEmbed | MessageEmbed[], messageOptions: MessageOptions = {}) => {
	if (!Array.isArray(embed)) {
		embed = [embed];
	}

	getChannel(channel).send({...messageOptions, embeds : embed});
};

export const getChannelById = (id: string) => {
	return DiscordJsManager.client().channels.cache.find(
		(c: TextChannel) => c.isText() && c.id === id
	) as TextChannel;
};

/**
 * So we can check if the ctx.channelID === 'gambling' or 'activities' for ex
 *
 * @param {string} channelId
 * @param {string} name
 * @returns {TextChannel}
 */
export const isOneOfChannels = (channelId: string, ...name: string[]) => {
	name = name.map(n => n.toLowerCase());

	return DiscordJsManager.client().channels.cache.some(
		(c: TextChannel) => c.isText() && name.includes(c.name.toLowerCase()) && c.id === channelId
	);
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
