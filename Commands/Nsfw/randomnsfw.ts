import {MessageEmbed} from "discord.js";
import {CommandContext, SlashCommand} from "slash-create";
import {getChannel, guildId} from "../../Util/Bot";
import axios, {AxiosResponse} from "axios";

export default class RandomNsfw extends SlashCommand{
	constructor(creator) {
		super(creator, {
			deferEphemeral: true,
			guildIDs: guildId,
			name: "randomnsfw",
			description: "Receive an Nsfw image."
		});
	}

	async run(ctx: CommandContext){
		try {
			const subreddits: String[] = ["ass","clits","boobs","vagina"];
			const randomSubreddit: String = subreddits[Math.floor(Math.random()*subreddits.length)];

			const nsfwChannel = getChannel('nsfw');

			if(ctx.channelID !== nsfwChannel.id) {
				return "Command is used in the wrong channel. Only usable in #nsfw.";
			}


			const response: AxiosResponse<any> = await axios.get(`https://meme-api.herokuapp.com/gimme/${randomSubreddit}`);

			const embed: MessageEmbed = new MessageEmbed()
				.setTitle(response.data.title as string)
				.setColor('RANDOM')
				.setImage(response.data.url);

			await ctx.send({embeds: [embed.toJSON()]});
		} catch (e) {
			console.error(e);
		}
	}
}
