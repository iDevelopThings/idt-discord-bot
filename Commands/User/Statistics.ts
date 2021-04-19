import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import {AvailableSkills} from "../../Models/User/Skills";
import User from "../../Models/User/User";
import {guild, guildId} from "../../Util/Bot";
import {formatMoney, formatXp} from "../../Util/Formatter";

export default class Statistics extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs    : guildId,
			name        : 'statistics',
			description : 'Get your stats or another users',
			options     : [
				{
					name        : 'user',
					description : 'Get the stats of another user',
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

		return {
			embeds : [
				new MessageEmbed()
					.setColor(member.displayHexColor)
					.setAuthor(user.displayName, user.avatar)
					.addField('Win/loss ratio', user.statistics.gambling.wins.count / user.statistics.gambling.losses.count, true)
					.addField('Most invested', formatMoney(user.statistics.balance.mostInvested), true)
					.addField('Most lost to taxes', formatMoney(user.statistics.balance.mostLostToTaxes), true)
					.addField('Times gambled', user.statistics.gambling.totals.count, true)
					.addField('Biggest win/loss amount', formatMoney(user.statistics.gambling.totals.mostMoney), true)
					.addField('Messages sent', user.statistics.activity.messagesSent, true),
				new MessageEmbed()
					.setColor("GREEN")
					.setTitle('Gambling Wins')
					.addField('Wins', user.statistics.gambling.wins.count, true)
					.addField('Biggest win', formatMoney(user.statistics.gambling.wins.mostMoney), true)
					.addField('Total won', formatMoney(user.statistics.gambling.wins.totalMoney), true),
				new MessageEmbed()
					.setColor("RED")
					.setTitle('Gambling Losses')
					.addField('Losses', user.statistics.gambling.losses.count, true)
					.addField('Biggest loss', formatMoney(user.statistics.gambling.losses.mostMoney), true)
					.addField('Total lost', formatMoney(user.statistics.gambling.losses.totalMoney), true)

			]
		};
	}
}
