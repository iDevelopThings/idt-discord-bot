import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {BalanceHistoryChangeType} from "../../Models/User/UserInformationInterfaces";
import {getChannel, guildId} from "../../Util/Bot";
import {formatMoney, InvalidNumberResponse, isValidNumber} from "../../Util/Formatter";
import NumberInput from "../../Util/NumberInput";

export default class Balance extends SlashCommand {
	constructor(creator) {
		super(creator, {
			deferEphemeral : true,
			guildIDs       : guildId,
			name           : 'balance',
			description    : 'Manage your balance',
			options        : [
				{
					name        : 'get',
					description : 'Get the current balance of yourself or another user.',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'If you want to see another users balance.',
							type        : CommandOptionType.USER,
						}
					]
				},
				{
					name        : 'gift',
					description : 'Gift some of your balance to another user.',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'The user to gift some balance too.',
							required    : true,
							type        : CommandOptionType.USER,
						},
						{
							name        : 'amount',
							description : 'The amount to gift the user.',
							required    : true,
							type        : CommandOptionType.STRING
						}
					]
				},
				{
					name        : 'history',
					description : 'See the balance change history for yourself or another user.',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'If you want to see another users history.',
							required    : false,
							type        : CommandOptionType.USER,
						}
					]
				},
			]
		});

		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		const gambleChannel = getChannel('gambling');

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /balance commands in the ${gambleChannel.toString()} channel.`;
		}

		switch (ctx.subcommands[0]) {
			case 'get': {
				const userObj = ctx.options.get as { user: string };
				const user    = await User.getOrCreate(userObj?.user ?? ctx.user.id);

				return this.handleBalanceOutput(ctx, user);
			}
			case 'gift': {
				const options     = ctx.options.gift as { user: string; amount: string; };
				const otherUser   = await User.getOrCreate(options.user);
				const currentUser = await User.getOrCreate(ctx.user.id);

				return await this.handleGiftBalance(ctx, options.amount, currentUser, otherUser);
			}
			case 'history': {
				const options = ctx.options.history as { user?: string; };

				return await this.handleHistory(ctx, options.user);
			}
		}

		return "You need to use one of the sub commands. /balance get, /balance gift, /balance history or /balance user";
	}

	/**
	 *
	 * @param {CommandContext} ctx
	 * @param {User} user
	 * @return {Promise<void>}
	 * @private
	 */
	private async handleBalanceOutput(ctx: CommandContext, user: User) {
		const embed = new MessageEmbed()
			.setColor('BLUE')
			.setAuthor(user.username, user.avatar, "")
			.addField('Balance:', formatMoney(user.balances.balance), true)
			.addField('Invested:', formatMoney(user.balances.invested), true)
			.addField('Income:', user.balanceManager().income(true), true);

		await ctx.send({embeds : [embed]});
	}

	/**
	 *
	 * @param {CommandContext} ctx
	 * @param {string} amount
	 * @param {User} currentUser
	 * @param {User} otherUser
	 * @return {Promise<string | InvalidNumberResponse>}
	 * @private
	 */
	private async handleGiftBalance(ctx: CommandContext, amount: string, currentUser: User, otherUser: User) {
		const isValid = isValidNumber(amount, currentUser.balanceManager());

		if (isValid !== InvalidNumberResponse.IS_VALID) {
			return isValid;
		}

		const input = new NumberInput(amount, currentUser).parse();

		if (!input.isValid()) {
			return input.error();
		}

		currentUser.balanceManager().deductFromBalance(input.value(), `Gifted money to ${otherUser.username}`);
		otherUser.balanceManager().addToBalance(input.value(), `Gifted by ${currentUser.username}`);

		await Promise.all([currentUser.executeQueued(), otherUser.executeQueued()]);

		return `You gave ${otherUser.toString()} ${formatMoney(amount)}`;
	}

	/**
	 *
	 * @param {CommandContext} ctx
	 * @param {string} otherUserId
	 * @return {Promise<string>}
	 * @private
	 */
	private async handleHistory(ctx: CommandContext, otherUserId?: string) {
		const user = await User.getOrCreate(otherUserId ? otherUserId : ctx.user.id);

		if (!user) {
			return "Cannot find user...";
		}

		const embed = new MessageEmbed()
			.setColor('BLUE')
			.setAuthor(user.username, user.avatar, "");

		if (!Array.isArray(user.balanceHistory) || user.balanceHistory.length === 0) {
			embed.addField('No Balance History', 'Start gambling bich...');
		} else {
			const balanceHistory = user.balanceHistory.slice(-10);

			for (let i = 0; i < balanceHistory.length; i++) {
				const history      = balanceHistory[i];
				const typeOfChange = history.typeOfChange === BalanceHistoryChangeType.ADDED ? 'to' : 'from';

				embed.addField(
					`#${user.balanceHistory.length - (balanceHistory.length - i - 1)} - ${history.typeOfChange} ${formatMoney(history.amount)} ${typeOfChange} ${history.balanceType}`,
					history.reason
				);
			}
		}

		await ctx.send({embeds : [embed]});
	}
}
