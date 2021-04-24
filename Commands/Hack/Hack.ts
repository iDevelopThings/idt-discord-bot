import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import DiscordJsManager from "../../Core/Discord/DiscordJsManager";
import User from "../../Models/User/User";
import {getChannel, guildId} from '../../Util/Bot';
import {formatMoney, formatPercentage, formatXp, numbro, percentOf} from "../../Util/Formatter";
import {getRandomInstance, getRandomInt, getRandomPercentage} from "../../Util/Random";

export default class Hack extends SlashCommand {

	constructor(creator) {
		super(creator, {
			deferEphemeral : true,
			guildIDs       : guildId,
			name           : 'hack',
			description    : 'Attempt to hack a user or the bot',
			options        : [
				{
					name        : 'bot',
					description : 'Hack the bot',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'user',
					description : 'Hack a user, it will cost you though...',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'Hack another user',
							type        : CommandOptionType.USER,
							required    : true
						}
					]
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const gambleChannel = getChannel('gambling');

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /hack commands in the ${gambleChannel.toString()} channel.`;
		}

		const user = await User.getOrCreate(ctx.user.id);

		const options = ctx.options as { bot?: string, user?: { user: string } };

		if (options?.bot) {
			return await this.hackBot(user);
		}

		if (options?.user?.user) {
			if (DiscordJsManager.client().user.id === options.user.user) {
				return "You cannot hack the bot like this. Use /hack bot.";
			}

			return await this.hackUser(user, options?.user?.user);
		}

		return "You must use /hack bot or /hack user";
	}

	private async hackBot(user: User) {
		const bot = await User.getOrCreate(DiscordJsManager.client().user.id);

		if (numbro(bot.balances.balance).value() === 0) {
			return 'The bot has no balance to hack right now... /gamble some more so it can make some money!';
		}

		if (!user.cooldownManager().canUse('botHack')) {
			return `You cannot hack the bot yet, try again in ${user.cooldownManager().timeLeft('botHack', true)}`;
		}

		await user.cooldownManager().setUsed('botHack');

		if (getRandomInt(0, 5) !== 1) {

			await user.skillManager().addXp('hacking', 15);

			if (getRandomInstance().boolean() && user.balanceManager().hasMoney()) {
				const balanceAvailable = user.balanceManager().hasMoneyType();

				const stealPercentage = getRandomPercentage(1, getRandomInt(10, 40));
				const stealAmount     = percentOf(user.balances[balanceAvailable], stealPercentage.toString());

				user.balanceManager().deductFromBalance(stealAmount, 'Bot reversed hack', balanceAvailable);
				bot.balanceManager().addToBalance(botAmount, `Reversed hack from ${user.username}`);

				await Promise.all([user.executeQueued(), bot.executeQueued()]);

				return `The bot reversed the hack and stole ${formatMoney(stealAmount)}(${formatPercentage(stealPercentage)}) from your ${balanceAvailable}`;
			}

			return 'You failed to get past the bots firewall... try again in an hour.';
		}

		const botBalance  = numbro(bot.balances.balance).value();
		const hackLevel   = user.skills.hacking.level;
		const xpForLevel  = (50 * (hackLevel / 10));
		const xpForAmount = ((botBalance * 0.1) / hackLevel);
		const xpGain      = Math.min(5_000, xpForAmount) + xpForLevel;

		user.skillManager().addXp('hacking', xpGain);
		user.balanceManager().addToBalance(botBalance.toString(), 'Successfully hacked bot');
		bot.balanceManager().deductFromBalance(botBalance.toString(), `Got hacked by ${user.username}`);

		await Promise.all([user.executeQueued(), bot.executeQueued()]);

		return `You successfully hacked the bot for ${formatMoney(botBalance)} and gained ${formatXp(String(xpGain))} hacking xp.`;
	}

	private async hackUser(user: User, otherUserId: string) {
		const otherUser = await User.getOrCreate(otherUserId);

		if (otherUser.id === user.id) {
			return "You can't hack yourself silly.";
		}

		if (!otherUser.balanceManager().hasMoney()) {
			return `${otherUser.toString()} doesn't have any money right now...`;
		}

		if (!user.cooldownManager().canUse('userHack')) {
			return `You cannot hack this user yet, try again in ${user.cooldownManager().timeLeft('userHack', true)}`;
		}

		const typeToStealFromOther = otherUser.balanceManager().hasMoneyType();
		const stealPercentage      = getRandomPercentage(1, getRandomInt(5, 15));
		const stealAmount          = percentOf(otherUser.balances[typeToStealFromOther], stealPercentage.toString());

		const costToStealAmount = getRandomPercentage(1, getRandomInt(5, 50));
		const stealAmountCost   = percentOf(otherUser.balances[typeToStealFromOther], stealPercentage.toString());

		if (!user.balanceManager().hasBalance(stealAmountCost)) {
			return `You need more than ${formatMoney(stealAmountCost)} to hack ${otherUser.toString()}... This is all we could tell from the small information you got about their accessible information.`;
		}

		user.cooldownManager().setUsed('userHack');
		user.balanceManager().deductFromBalance(stealAmountCost, `Cost for hacking ${otherUser.username}`);

		if (getRandomInt(0, 3) !== 1) {
			const amountGivenToOther = numbro(stealAmountCost).multiply(0.8).value();

			user.skillManager().addXp('hacking', 15);
			otherUser.balanceManager().addToBalance(amountGivenToOther.toString(), `Reversed hack from ${user.username}`);

			await Promise.all([user.executeQueued(), otherUser.executeQueued()]);

			return `${otherUser.toString()} reversed the hack and stole ${formatMoney(amountGivenToOther)} from you.`;

		}

		const stealAmountForXp = numbro(stealAmount).value();
		const hackLevel        = user.skills.hacking.level;
		const xpForLevel       = (50 * (hackLevel / 10));
		const xpForAmount      = ((stealAmountForXp * 0.1) / hackLevel);
		const xpGain           = Math.min(5_000, xpForAmount) + xpForLevel;

		user.skillManager().addXp('hacking', xpGain);
		user.balanceManager().addToBalance(stealAmount.toString(), `Hacked ${otherUser.username}`);
		otherUser.balanceManager().deductFromBalance(stealAmount, `Hacked by ${user.username}`, typeToStealFromOther);

		await Promise.all([user.executeQueued(), otherUser.executeQueued()]);

		return `You successfully hacked ${otherUser.toString()} for ${formatMoney(stealAmount)} and gained ${formatXp(String(xpGain))} hacking xp.`;
	}
}
