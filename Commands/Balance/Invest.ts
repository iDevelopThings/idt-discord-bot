import {GuildMember, MessageReaction} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {StatisticsKeys} from "../../Models/User/UserInformationInterfaces";
import {getChannel, getChannelById, guildId} from "../../Util/Bot";
import {formatMoney, numbro} from "../../Util/Formatter";
import NumberInput from "../../Util/NumberInput";
import {getRandomPercentage} from "../../Util/Random";


interface WithdrawOptions {
	short?: {
		percent: string;
	},
	input?: {
		amount: string;
	}
}

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
					name        : 'add_amount',
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
					name        : 'add_percent',
					description : 'Add money from your balance, to your investment using a percent instead.',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'amount',
							description : 'The amount to add',
							required    : true,
							choices     : [
								{name : '100%', value : '100%'},
								{name : '75%', value : '75%'},
								{name : '50%', value : '50%'},
								{name : '25%', value : '25%'},
								{name : '10%', value : '10%'},
							],
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
		const gambleChannel = getChannel('gambling');

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /invest commands in the ${gambleChannel.toString()} channel.`;
		}

		const user = await User.getOrCreate(ctx.user.id);

		if (ctx.subcommands.includes('add_percent') || ctx.subcommands.includes('add_amount')) {
			return await this.addToInvestment(ctx, user);
		}

		if (ctx.subcommands.includes('claim')) {
			return await this.claim(ctx, user);
		}

		if (ctx.subcommands.includes('withdraw')) {
			return await this.withdraw(ctx, user);
		}

	}

	async addToInvestment(ctx: CommandContext, user: User) {

		const isPercent    = !!ctx.options?.add_percent;
		const options: any = ctx.options[isPercent ? 'add_percent' : 'add_amount'];

		const input = new NumberInput(options.amount, user).parse();

		if (!input.isValid()) {
			return input.error();
		}

		const amount = input.value();

		user.updateStatistic(StatisticsKeys.MOST_INVESTED, amount);
		user.balanceManager().deductFromBalance(amount, 'Removed from balance... Adding to investment');
		user.balanceManager().addToBalance(amount, 'Added to investment from balance', 'invested');
		user.skillManager().addXp('investing', 50);
		await user.executeQueued();

		return `${formatMoney(amount)} has been added to your investments.`;
	}

	private async claim(ctx: CommandContext, user: User) {

		if (!user.cooldownManager().canUse('claim')) {
			return `You cannot claim for another ${user.cooldownManager().timeLeft('claim', true)}.`;
		}

		const {income} = await user.balanceManager().claimInvestment();

		return `You claimed ${formatMoney(income, true)} from your investments.`;
	}

	private async withdraw(ctx: CommandContext, user: User) {
		const channel       = getChannelById(ctx.channelID);
		const randomPercent = getRandomPercentage(3, 30);
		const options       = ctx.options.withdraw as WithdrawOptions;

		const input = new NumberInput(
			options?.short?.percent ?? options?.input?.amount, user
		).parse();

		if (!input.isValid()) {
			return input.error();
		}

		const amount: string = input.value();

		//		const amount = options?.short?.percent
		//			? percentOf(user.balances.invested, options.short.percent)
		//			: numbro(options.input.amount).value();


		//		const valid = isValidNumber(String(amount));
		//		if (valid !== InvalidNumberResponse.IS_VALID) {
		//			return valid;
		//		}

		//		if (!user.balanceManager().hasBalance(amount, 'invested')) {
		//			return `You do not have ${formatMoney(amount)} invested to withdraw`;
		//		}

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

			user.cooldownManager().setUsed('withdrawInvestment');
			await user.executeQueued();

			await ctx.editOriginal('You declined... you can use this again in 30 minutes.');
			return;
		}

		const withdrawAmount = numbro(amount).subtract(loss).value();

		if (loss > numbro(user.statistics.balance.mostLostToTaxes).value()) {
			user.statistics.balance.mostLostToTaxes = String(loss);
		}

		user.updateStatistic(StatisticsKeys.MOST_LOST_TO_TAXES, loss);
		user.balanceManager().deductFromBalance(withdrawAmount + loss, 'Withdrawn from investment');
		user.balanceManager().addToBalance(withdrawAmount, `Added to balance from withdrawn investment`);

		await user.executeQueued();

		await message.reactions.cache.each(r => r.remove());
		await ctx.editOriginal(`You withdrawn ${formatMoney(withdrawAmount)} from your investment. You lost ${formatMoney(loss)} due to fluctuations in the market.`);
	}
}
