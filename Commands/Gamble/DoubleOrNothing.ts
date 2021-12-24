import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import DiscordJsManager from "../../Core/Discord/DiscordJsManager";
import User from "../../Models/User/User";
import {getChannel, guildId} from "../../Util/Bot";
import {formatMoney, numbro} from "../../Util/Formatter";
import NumberInput from "../../Util/NumberInput";
import {getRandomInt, getRandomPercentage} from "../../Util/Random";

export default class DoubleOrNothing extends SlashCommand {
	constructor(creator) {
		super(creator, {
			guildIDs       : guildId,
			name           : "double",
			deferEphemeral : true,
			description    : "Double your money or get nothing",
			options        : [
				{
					name        : 'amount',
					description : 'Specify a custom amount to use. If none is specified, your whole balance will be used.',
					required    : false,
					default     : true,
					type        : CommandOptionType.STRING,
				}
			]
		});

		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		const gambleChannel = getChannel("gambling");

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /gamble commands in the ${gambleChannel.toString()} channel.`;
		}

		const user = await User.getOrCreate(ctx.user.id);

		if (!user.balanceManager().hasMoney('balance')) {
			return `You don't have any money, pleb`;
		}

		let amountInput = ctx.options?.amount;

		if (!amountInput) {
			amountInput = user.balanceManager().get('balance');
		}

		const input = new NumberInput(String(amountInput), user).parse();

		if (!input.isValid()) {
			return input.error();
		}

		const amount = input.value();

		user.balanceManager().deductFromBalance(amount, 'Double or nothing');
		await user.executeQueued();

		const randomWinningSide = getRandomInt(0, 1);

		if (getRandomInt(0, 1) === randomWinningSide) {
			user.balanceManager().addToBalance(numbro(amount).multiply(2).value(), 'Double or nothing winnings');
			await user.executeQueued();

			await user.refresh();

			await ctx.send({
				embeds : [
					new MessageEmbed()
						.setColor('GREEN')
						.setAuthor(user.username, user.avatar, "")
						.setTitle('Great success')
						.setDescription(`Your balance is now: ${formatMoney(user.balanceManager().get('balance'))}`)
				]
			});
			return;
		}


		const bot = await User.getOrCreate(DiscordJsManager.client().user.id);
		bot.balanceManager().addToBalance(
			numbro(NumberInput.someFuckingValueToInt(amount)).multiply(getRandomPercentage(70, 99)).value(),
			'Taken from losers input during double or nothing.'
		);
		await bot.executeQueued();

		await ctx.send({
			embeds : [
				new MessageEmbed()
					.setColor('RED')
					.setAuthor(user.username, user.avatar, "")
					.setTitle('Unlucky.')
					.setDescription(`You lost: ${formatMoney(amount)}`)
			]
		});
	}
}
