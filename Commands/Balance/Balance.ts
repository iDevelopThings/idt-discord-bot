import {MessageEmbed, TextChannel} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {UserInstance} from "../../Models/User/UserInstance";
import {guild, guildId} from "../../Util/Bot";
import {formatMoney, InvalidNumberResponse, isValidNumber} from "../../Util/Formatter";

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
					description : 'Get your balance',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'user',
					description : 'Get a users balance',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							required    : true,
							description : 'The user to get the balance of',
							type        : CommandOptionType.USER,
						}
					]
				},
				{
					name        : 'gift',
					description : 'Gift some of your balance to another user',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'The user to gift some balance too',
							required    : true,
							type        : CommandOptionType.USER,
						},
						{
							name        : 'amount',
							description : 'The amount to gift the user',
							required    : true,
							type        : CommandOptionType.STRING
						}
					]
				},
				{
					name        : 'history',
					description : 'See the balance change history for yourself or another user',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'If you want to see another users history ',
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

		if (ctx.subcommands.includes('get')) {
			const user = await User.get(ctx.user.id);

			return await this.handleBalanceOutput(ctx, user);
		}

		if (ctx.subcommands.includes('user')) {

			const userObj = ctx.options.user as { user: string };

			const user = await User.get(userObj.user);

			return await this.handleBalanceOutput(ctx, user);
		}

		if (ctx.subcommands.includes('gift')) {
			const options = ctx.options.gift as { user: string; amount: string; };

			const otherUser   = await User.get(options.user);
			const currentUser = await User.get(ctx.user.id);

			return await this.handleGiftBalance(ctx, options.amount, currentUser, otherUser);
		}

		if (ctx.subcommands.includes('history')) {
			const options = ctx.options.history as { user?: string; };

			return await this.handleHistory(ctx, options.user);
		}


		return "You need to use one of the sub commands. /balance gift, /balance user or /balance get";
	}

	private async handleBalanceOutput(ctx: CommandContext, user: UserInstance) {
		const channel = guild().channels.cache.get(ctx.channelID) as TextChannel;

		const embed = new MessageEmbed()
			.setColor('BLUE')
			.setAuthor(user.username, user.avatar, "")
			.addField('Balance:', formatMoney(user.balances.balance), true)
			.addField('Invested:', formatMoney(user.balances.invested), true)
			.addField('Income:', user.balanceManager().income(true), true);

		await ctx.send({embeds : [embed]});
	}

	private async handleGiftBalance(ctx: CommandContext, amount: string, currentUser: UserInstance, otherUser: UserInstance) {

		const isValid = isValidNumber(amount, currentUser.balanceManager());

		if (isValid !== InvalidNumberResponse.IS_VALID) {
			return isValid;
		}

		currentUser.balanceManager().deductFromBalance(amount);
		currentUser.balanceManager().changed({
			amount       : amount,
			balanceType  : "balance",
			typeOfChange : "removed",
			reason       : `Gifted money to ${otherUser.username}`
		});
		await currentUser.save();

		otherUser.balanceManager().addToBalance(amount);
		otherUser.balanceManager().changed({
			amount       : amount,
			balanceType  : "balance",
			typeOfChange : "added",
			reason       : `Gifted by ${currentUser.username}`
		});
		await otherUser.save();

		return `You gave ${otherUser.toString()} ${formatMoney(amount)}`;
	}

	private async handleHistory(ctx: CommandContext, otherUserId?: string) {

		const user = await User.get(otherUserId ? otherUserId : ctx.user.id);

		if (!user) {
			return "Cannot find user...";
		}

		let history = [];
		if (!user?.balanceHistory) {
			return `${user.toString()} does not have any balance history...`;
		}

		let historyString = '';

		historyString += user.balanceHistory.splice(-10).map(history => {
			return `${history.typeOfChange} ${formatMoney(history.amount)} to ${history.balanceType} \n${history.reason}\n`;
		}).join('\n');

		return `${user.toString()}'s balance history: \n` + "```"+historyString+"```";
	}
}
