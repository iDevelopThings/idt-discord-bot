import {MessageEmbed} from "discord.js";
import {CommandContext, SlashCommand} from "slash-create";
import {guildId} from "../../Util/Bot";
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

			if(ctx.channelID !== "388442930618302475") {
				await ctx.send("Invalid Channel. Only usable in #nsfw.");
				return
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
