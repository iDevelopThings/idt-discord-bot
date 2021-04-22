import {Guild, TextChannel} from "discord.js";
import {client} from "../index";

export const guildId = process.env.GUILD_ID;
export const guild   = (): Guild => client.guilds.cache.get(guildId);


export const getGambleChannel = (): TextChannel => {
	return client.channels.cache.find((c: TextChannel) => {
		return c.isText() && c?.name === 'gambling';
	}) as TextChannel;
};

export const getChannel = (channel: string): TextChannel => {
	return client.channels.cache.find(
		(c: TextChannel) => c.isText() && c.name.toLowerCase() === channel.toLowerCase()
	) as TextChannel;
};


export const getGamblingWebhook = async () => {
	//	const storedId = await BotSettings.get<string>('gamblingWebhookId');
	//
	//	if (storedId) {
	//		return await client.fetchWebhook(storedId);
	//	}
	//
	//	const channel = getGambleChannel();
	//
	//	const webhooks = await channel.fetchWebhooks();
	//	let webhook    = webhooks.find(wh => wh.name === 'betters_webhook');
	//
	//	if (!webhook) {
	//		webhook = await channel.createWebhook('betters_webhook', {
	//			avatar : client.user.avatarURL()
	//		});
	//	}


	//	await BotSettings.set('gamblingWebhookId', webhook.id);
	//	await BotSettings.set('gamblingWebhookToken', webhook.token);


	//	return await client.fetchWebhook(webhook.id, webhook.token);
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
