import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {guild, guildId} from "../../Util/Bot";
import {formatMoney} from "../../Util/Formatter";
import {getNewSpamInflictedXp} from "../../Util/SpamShit";

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
		const user   = await User.getOrCreate(userId);

		const member = guild().members.cache.get(userId);

		const formatNumber = (val: number) => {
			if (isNaN(val)) {
				return 0;
			}

			return val;
		};

		const [messageXpRate] = await getNewSpamInflictedXp(30, user);

		return {
			embeds : [
				new MessageEmbed()
					.setColor(member.displayHexColor)
					.setAuthor(user.displayName, user.avatar)
					.addField('Win/loss ratio', formatNumber(user.statistics.gambling.wins.count / user.statistics.gambling.losses.count), true)
					.addField('Most invested', formatMoney(user.statistics.balance.mostInvested), true)
					.addField('Most lost to taxes', formatMoney(user.statistics.balance.mostLostToTaxes), true)
					.addField('Times gambled', formatNumber(user.statistics.gambling.totals.count), true)
					.addField('Biggest win/loss amount', formatMoney(user.statistics.gambling.totals.mostMoney), true),
				new MessageEmbed()
					.setColor("BLURPLE")
					.setTitle('Messaging')
					.addField('Messages Sent', formatNumber(user.statistics.activity.messagesSent), false)
					.addField('Message Xp Rate', `${formatNumber(messageXpRate)}/message`, false),
				new MessageEmbed()
					.setColor("GREEN")
					.setTitle('Gambling Wins')
					.addField('Wins', formatNumber(user.statistics.gambling.wins.count), true)
					.addField('Biggest win', formatMoney(user.statistics.gambling.wins.mostMoney), true)
					.addField('Total won', formatMoney(user.statistics.gambling.wins.totalMoney), true),
				new MessageEmbed()
					.setColor("RED")
					.setTitle('Gambling Losses')
					.addField('Losses', formatNumber(user.statistics.gambling.losses.count), true)
					.addField('Biggest loss', formatMoney(user.statistics.gambling.losses.mostMoney), true)
					.addField('Total lost', formatMoney(user.statistics.gambling.losses.totalMoney), true)

			]
		};
	}
}
