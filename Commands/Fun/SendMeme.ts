import {Log} from "@envuso/common";
import {Buffer} from "buffer";
import {MessageAttachment, MessageEmbed, TextChannel, Util} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext, {MessageOptions} from "slash-create/lib/context";
import Meme from "../../Handlers/Meme";
import {collection} from "../../Models/ModelHelper";
import {guild, guildId} from "../../Util/Bot";
import {createDuration} from "../../Util/Date";
import {BotSettings} from "../../Util/Settings";


export default class SendMeme extends SlashCommand {

	constructor(creator) {
		super(creator, {
			deferEphemeral : true,
			guildIDs       : guildId,
			name           : 'meme',
			description    : 'Send a random meme from reddit',
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {

		const channel      = guild().channels.cache.get(ctx.channelID);
		const memesChannel = guild().channels.cache.find(c => c.name === 'memes');
		//		const nsfwChannel  = guild().channels.cache.find(c => c.name === 'nsfw');

		if (!channel.equals(memesChannel) /*&& !channel.equals(nsfwChannel)*/) {
			return `You can only use this command in the ${memesChannel.toString()} channel.`;
		}

		const meme = await Meme.getMeme(false);

		const recent = await BotSettings.get<string[]>('recentMemes');

		if (recent?.includes(meme.postLink)) {
			Log.warn('PREVENTED A DUPLICATE OF ' + meme.url);
			await meme.regenerate();
		} else {
			const current = recent || [];
			current.push(meme.postLink);

			await BotSettings.set('recentMemes', current, createDuration(5, 'minutes').as('milliseconds'));
		}

		await ctx.send('Your meme is coming good sir');

		await (channel as TextChannel).send({
			content : meme.isNsfw() ? '**This content is NSFW**' : '',
			files       : [
				{
					attachment : meme.url,
					name       : meme.isNsfw() ? 'SPOILER_FILE.jpg' : 'meme.jpg'
				}
			]
		});

		await ctx.delete();
	}

}
