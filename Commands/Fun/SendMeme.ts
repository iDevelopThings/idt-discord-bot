import {TextChannel} from "discord.js";
import {SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import MemeApi from "../../Handlers/MemeApi";
import Meme from "../../Models/Meme";
import {getChannel, guild, guildId} from "../../Util/Bot";

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

		const memesChannel = getChannel('memes');

		if (ctx.channelID !== memesChannel.id) {
			return `You can only use this command in the ${memesChannel.toString()} channel.`;
		}

		const meme = await MemeApi.getMeme(false);

		if (await Meme.exists(meme.url)) {
			await meme.regenerate();
		} else {
			await Meme.create<Meme>(meme);
		}

		await ctx.send('Your meme is coming good sir');

		await memesChannel.send({
			content : meme.isNsfw() ? '**This content is NSFW**' : '',
			files   : [
				{
					attachment : meme.url,
					name       : meme.isNsfw() ? 'SPOILER_FILE.jpg' : 'meme.jpg'
				}
			]
		});

		await ctx.delete();
	}

}
