import {GuildMember, MessageReaction, TextChannel} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {UserInstance} from "../../Models/User/UserInstance";
import {guild, guildId} from "../../Util/Bot";
import {formatMoney, InvalidNumberResponse, isValidNumber, numbro, percentOf} from "../../Util/Formatter";
import {getRandomPercentage} from "../../Util/Random";

const THUMBS_UP   = '👍';
const THUMBS_DOWN = '👎';

export default class Invest extends SlashCommand {

	constructor(creator) {
		super(creator, {
			deferEphemeral : true,
			guildIDs       : guildId,
			name           : 'investment',
			description    : 'Manage your investment',
			options        : [
				{
					name        : 'add',
					description : 'Add money from your balance, to your investment.',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'amount',
							description : 'The amount to add',
							required    : true,
							type        : CommandOptionType.STRING
						}
					]
				},
				{
					name        : 'claim',
					description : 'Claim your income from your investment',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'withdraw',
					description : 'Withdraw money from your invested balance',
					type        : CommandOptionType.SUB_COMMAND_GROUP,
					options     : [
						{
							name        : 'input',
							description : 'The amount to withdraw',
							type        : CommandOptionType.SUB_COMMAND,
							options     : [
								{
									name        : 'amount',
									description : 'The amount to withdraw',
									type        : CommandOptionType.STRING,
									required    : true
								},
							]
						},
						{
							name        : 'short',
							description : 'Pick a percentage to use instead of typing an amount',
							type        : CommandOptionType.SUB_COMMAND,
							options     : [
								{
									name        : 'percent',
									description : 'The percent to withdraw',
									type        : CommandOptionType.STRING,
									required    : true,
									choices     : [
										{name : '100%', value : '100%'},
										{name : '75%', value : '75%'},
										{name : '50%', value : '50%'},
										{name : '25%', value : '25%'},
										{name : '10%', value : '10%'},
									]
								}
							]
						},
					]
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const user = await User.get(ctx.user.id);

		if (ctx.subcommands.includes('add')) {
			return await this.addToInvestment(ctx, user);
		}

		if (ctx.subcommands.includes('claim')) {
			return await this.claim(ctx, user);
		}

		if (ctx.subcommands.includes('withdraw')) {
			return await this.withdraw(ctx, user);
		}

	}

	async addToInvestment(ctx: CommandContext, user: UserInstance) {
		const addInformation = ctx.options.add as { amount: string };

		let amount = addInformation.amount.toLowerCase();
		switch (amount) {
			case "all":
				amount = user.balances.balance;
				break;
			case "half":
				amount = numbro(user.balances.balance).divide(2).value().toString();
				break;
		}

		const valid = isValidNumber(amount);
		if (valid !== InvalidNumberResponse.IS_VALID) {
			return valid;
		}

		if (!user.balanceManager().hasBalance(amount)) {
			return 'You dont have enough money in your balance.';
		}

		if (numbro(amount).value() > numbro(user.statistics.balance.mostInvested).value()) {
			user.statistics.balance.mostInvested = amount;
		}

		user.balanceManager().deductFromBalance(amount);
		user.balanceManager().addToBalance(amount, 'invested');
		await user.save();

		return `${formatMoney(amount)} has been added to your investments.`;
	}

	private async claim(ctx: CommandContext, user: UserInstance) {

		if (!user.cooldownManager().canUse('claim')) {
			return `You cannot claim for another ${user.cooldownManager().timeLeft('claim', true)}.`;
		}

		const income = String(user.balanceManager().income());

		user.balanceManager().addToBalance(income);
		await user.save();

		await user.cooldownManager().setUsed('claim');

		return `You claimed ${formatMoney(income)} from your investments.`;
	}

	private async withdraw(ctx: CommandContext, user: UserInstance) {
		const channel       = guild().channels.cache.get(ctx.channelID) as TextChannel;
		const randomPercent = getRandomPercentage(3, 30);

		interface options {
			short?: {
				percent: string;
			},
			input?: {
				amount: string;
			}
		}

		const options = ctx.options.withdraw as options;

		const amount = options?.short?.percent
			? percentOf(user.balances.invested, options.short.percent)
			: numbro(options.input.amount).value();


		const valid = isValidNumber(String(amount));
		if (valid !== InvalidNumberResponse.IS_VALID) {
			return valid;
		}

		if (!user.balanceManager().hasBalance(String(amount), 'invested')) {
			return `You do not have ${formatMoney(amount)} invested to withdraw`;
		}

		const loss = numbro(amount).multiply(randomPercent).value();

		if (!user.cooldownManager().canUse('withdrawInvestment')) {
			return `You are still on cooldown, try again in ${user.cooldownManager().timeLeft('withdrawInvestment', true)}`;
		}

		await ctx.send(
			[
				`Are you sure you want to withdraw?`,
				`If you pull out now, you will lose ${formatMoney(loss)} due to fluctuations in the market.`,
				`If you decline, you will need to wait 30 minutes before you can withdraw again.`
			].join('\n')
		);

		const originalMessage = await ctx.fetch();
		const message         = channel.messages.resolve(originalMessage.id);

		await message.react(THUMBS_UP);
		await message.react(THUMBS_DOWN);

		const reactions = await message.awaitReactions((reaction: MessageReaction, reactedUser: GuildMember) => {
			return [THUMBS_UP, THUMBS_DOWN].includes(reaction.emoji.name) && reactedUser.id === user.id;
		}, {
			time      : 30_000,
			maxEmojis : 1
		});

		const reaction = reactions.first();

		if (reaction.emoji.name === THUMBS_DOWN) {
			await message.reactions.cache.each(r => r.remove());
			await user.cooldownManager().setUsed('withdrawInvestment');
			await ctx.editOriginal('You declined... you can use this again in 30 minutes.');
			return;
		}

		const withdrawAmount = numbro(amount).subtract(loss).value().toString();

		if (loss > numbro(user.statistics.balance.mostLostToTaxes).value()) {
			user.statistics.balance.mostLostToTaxes = String(loss);
		}

		user.balanceManager().deductFromBalance(withdrawAmount + loss, 'invested');
		user.balanceManager().addToBalance(withdrawAmount);
		await user.save();

		await message.reactions.cache.each(r => r.remove());
		await ctx.editOriginal(`You withdrawn ${formatMoney(withdrawAmount)} from your investment. You lost ${formatMoney(loss)} due to fluctuations in the market.`);
	}
}
