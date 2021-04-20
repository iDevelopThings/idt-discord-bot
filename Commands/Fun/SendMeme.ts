import {TextChannel, Util} from "discord.js";
import { SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import Meme from "../../Handlers/Meme";
import MemeModel from "../../Models/MemeModel";
import {guild, guildId} from "../../Util/Bot";



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

		if (!channel.equals(memesChannel)) {
			return `You can only use this command in the ${memesChannel.toString()} channel.`;
		}

		const meme = await Meme.getMeme(false);

		if(await MemeModel.exists(meme.url)){
			await meme.regenerate();
		} else {
			await MemeModel.store(meme);
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
