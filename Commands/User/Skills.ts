import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import {GamblingColor} from "../../Handlers/Gambling/Gambling";
import {AvailableSkills} from "../../Models/User/Skills";
import User from "../../Models/User/User";
import {guild, guildId} from "../../Util/Bot";
import {formatXp, numbro} from "../../Util/Formatter";

export default class Skills extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs    : guildId,
			name        : 'skills',
			description : 'Get your skill levels/xp or another users',

			options : [
				{
					name        : 'user',
					description : 'Get the skills/xp of another user',
					type        : CommandOptionType.USER,
					required    : false,
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const userId = String(ctx.options.user ?? ctx.user.id);
		const user   = await User.get(userId);

		const member = guild().members.cache.get(userId);

		const embeds = [
			new MessageEmbed()
				.setColor(member.displayHexColor)
				.setAuthor(user.displayName, user.avatar)
		];

		Object.keys(user.skills).forEach(key => {
			embeds.push(
				new MessageEmbed()
					.setTitle(AvailableSkills[key].title)
					.setColor(AvailableSkills[key].color)
					.addField('Level', user.skills[key].level, true)
					.addField('XP', formatXp(user.skills[key].xp), true)
			);
		});


		return {
			embeds : embeds
		};
	}
}
