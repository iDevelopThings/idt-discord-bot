import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import {DiceRoll} from "../../Handlers/Gambling/DiceRoll/DiceRoll";
import User from "../../Models/User/User";
import {getChannel, guildId} from "../../Util/Bot";
import {formatMoney, numbro} from "../../Util/Formatter";
import NumberInput from "../../Util/NumberInput";
import {getRandomInt} from "../../Util/Random";

export default class GambleDiceRoll extends SlashCommand {
	constructor(creator) {
		super(creator, {
			guildIDs       : guildId,
			name           : "diceroll",
			deferEphemeral : true,
			description    : "Bet some money on the side the dice will land on",
			options        : [
				{
					name        : 'amount',
					description : 'How much money do you want to bet?',
					type        : CommandOptionType.INTEGER,
					required    : true,
				},
				{
					name        : 'side',
					description : 'Which number do you think the dice will land on? (1-6)',
					type        : CommandOptionType.INTEGER,
					required    : true,
				},
				{
					name        : 'dies',
					description : 'How many dice do want to roll? (Minimum of: 1, max of: You choose)',
					type        : CommandOptionType.INTEGER,
					required    : false,
				},
			]
		});

		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		const gambleChannel = getChannel("gambling");

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /gamble commands in the ${gambleChannel.toString()} channel.`;
		}

		let user = await User.getOrCreate(ctx.user.id);

		if (!user.balanceManager().hasMoney('balance')) {
			return `You don't have any money, pleb`;
		}

		if (!ctx.options.dies) {
			ctx.options.dies = 1;
		}
		if (ctx.options.dies < 1) {
			ctx.options.dies = 1;
		}

		const side  = Number(ctx.options.side);
		const input = new NumberInput(String(ctx.options.amount), user).parse();

		if (!input.isValid()) {
			return input.error();
		}

		const diceRoll = new DiceRoll(Number(ctx.options.dies));

		const [isValidSide, errorMessage] = diceRoll.validateSideInput(side);
		if (!isValidSide) {
			return errorMessage;
		}

		diceRoll.roll();

		user.balanceManager().deductFromBalance(input.value(), 'Dice roll');
		await user.executeQueued();

		if (!diceRoll.isWinningSide(side)) {
			await user.refresh();

			await ctx.send({
				embeds : [
					new MessageEmbed()
						.setColor('RED')
						.setAuthor(user.username, user.avatar, "")
						.setTitle('Unlucky, you lost')
						.setDescription(`The winning number was ${diceRoll.valuesTotal()}`)
						.addField('New balance', user.balanceManager().getFormattedBalance(), false)
						.addField('Total dice', diceRoll.getDieCount(), true)
						.addField('Total sides', diceRoll.getTotalSides(), true)
				]
			});

			return;
		}

		const [wonAmount, wonAmountFormatted] = diceRoll.getWinningsForInput(input, side);

		user.balanceManager().addToBalance(wonAmount, 'Won dice roll');
		await user.executeQueued();
		await user.refresh();

		await ctx.send({
			embeds : [
				new MessageEmbed()
					.setColor('GREEN')
					.setAuthor(user.username, user.avatar, "")
					.setTitle('Great success')
					.setDescription(`Your wager of ${input.formattedMoneyValue()} was multiplied by ${diceRoll.getTotalSides()}.`)
					.addField('Winnings', wonAmountFormatted, true)
					.addField('New balance', user.balanceManager().getFormattedBalance(), true)
					.addField('Total dice', diceRoll.getDieCount(), true)
					.addField('Total sides', diceRoll.getTotalSides(), true)
			]
		});
	}
}
