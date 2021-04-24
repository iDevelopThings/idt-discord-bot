import {ColorResolvable, Message, MessageEmbed} from "discord.js";
import {Decimal128} from "mongodb";
import DiscordJsManager from "../../Core/Discord/DiscordJsManager";
import User from "../../Models/User/User";
import {formatMoney, InvalidNumberResponse, isValidNumber, numbro, Numbro, numbroParse} from "../../Util/Formatter";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import {getRandomInt} from "../../Util/Random";
import {GamblingInstance, GamblingStatus} from "./GamblingInstance";
import {GamblingInstanceType} from "./GamblingInstanceManager";

interface Bet {
	color: GamblingColor;
	amount: SomeFuckingValue;
	user: User;
}

interface EndingBet extends Bet {
	takings?: SomeFuckingValue;
	loss?: SomeFuckingValue;
}

export enum GamblingColor {
	RED   = 0,
	BLACK = 1,
}

interface EndingInformation {
	winners: EndingBet[];
	losers: EndingBet[];
	color: GamblingColor;
	botTookWinnings: boolean;
}

//interface BettingEmbed {
//	information: MessageEmbed;
//	redBetters: MessageEmbed[];
//	blackBetters: MessageEmbed[];
//}

interface GapColors {
	color: ColorResolvable;
	smallerThanGap: () => boolean;
}

export class Gambling extends GamblingInstance {

	private _betters: Bet[] = [];

	private _winningColor: GamblingColor;

	private _endingInformation: EndingInformation = {
		winners         : [],
		losers          : [],
		color           : null,
		botTookWinnings : false,
	};

	private _betMessage: Message = null;

	private _embed: MessageEmbed = new MessageEmbed();

	constructor() {
		super();

		this._gameType = GamblingInstanceType.RED_BLACK;

		//		this._startTimerLength = 30_000;
		this._startTimerLength = 5_000;

		this.setStartingTimerStartedHandler(this._onStarted.bind(this));
		this.setStartTimerEndedHandler(this._onEnded.bind(this));
		this.setStartingTimerTickHandler(this._countdown.bind(this));
	}

	/**
	 * Check if this user has placed a bet yet.
	 *
	 * @param {User} user
	 * @returns {boolean}
	 */
	hasPlacedBet(user: User) {
		return this._betters.some(bet => bet.user.id === user.id);
	}

	private getUserBet(user: User) {
		return this._betters.find(bet => bet.user.id === user.id);
	}

	/**
	 * Place a bet as x user against a color
	 *
	 * @param {User} user
	 * @param {GamblingColor} color
	 * @param {string} amount
	 * @returns {Promise<{joined: boolean, message: string} | {joined: boolean, message: string} | {joined: boolean, message: string}>}
	 */
	async placeBet(user: User, color: GamblingColor, amount: SomeFuckingValue) {

		//		const isValid = isValidNumber(amount);
		//
		//		if (isValid !== InvalidNumberResponse.IS_VALID) {
		//			return {
		//				message : isValid,
		//				joined  : false,
		//			};
		//		}
		//
		//		let parsedAmount: number = numbroParse(amount);
		//
		//		if (!user.balanceManager().hasBalance(parsedAmount.toString())) {
		//			return {
		//				joined  : false,
		//				message : 'You do not have enough money to do this.',
		//			};
		//		}

		const existingBet = this.getUserBet(user);

		if (existingBet && existingBet.color !== color) {
			return {
				joined  : false,
				message : 'You can\'t change colors mid bet.',
			};
		}

		const totalAmount = this.getTotalBetAmount(user, amount);
		const minimumBet  = this.minimumBet();

		if (amount < minimumBet) {
			return {
				joined  : false,
				message : `You need to place a bet of at least ${minimumBet}.`,
			};
		}

		if (existingBet) {
			existingBet.amount = totalAmount;
		} else {
			this._betters.push({color, user, amount});
		}

		user.balanceManager().deductFromBalance(amount, 'Placed a bet');

		await user.executeQueued();

		// If we're the first person to place a bet, we'll start
		// the countdown for other's to place bets.
		if (this._status === GamblingStatus.STARTING) {
			this.restartCountdown();
		} else {
			this.startTimer();
		}

		return {
			joined     : true,
			message    : 'Success',
			updatedBet : !!existingBet,
		};
	}

	/**
	 * Calculate the winners, if there's no winners, the bot will take all winnings
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	private async finishGambling() {
		this._winningColor            = getRandomInt(0, 1);
		this._endingInformation.color = this._winningColor;

		let totalLooserAmount = 0;

		this._betters.forEach(bet => {
			const type                 = bet.color === this._endingInformation.color ? 'winners' : 'losers';
			const endingBet: EndingBet = bet;

			if (type === 'losers') {
				endingBet.loss    = endingBet.amount;
				totalLooserAmount = numbro(totalLooserAmount)
					.add(NumberInput.someFuckingValueToInt(bet.amount))
					.value();
			}

			this._endingInformation[type].push(endingBet);
		});

		const cutPerPerson = totalLooserAmount / (this._endingInformation.winners.length || 1);

		this._status = GamblingStatus.ENDED;

		if (!this._endingInformation.winners.length) {
			const botUser = await User.getOrCreate(DiscordJsManager.client().user.id);

			const botAmount = totalLooserAmount;

			this._endingInformation.winners.push({
				color   : this._winningColor,
				amount  : botAmount,
				takings : botAmount,
				user    : botUser,
			});

			this._endingInformation.botTookWinnings = true;

		} else {
			this._endingInformation.winners.forEach(bet => {
				bet.takings = numbro(bet.amount).multiply(2).add(cutPerPerson).value().toString();
			});
		}

		const setStatistics = (user: User, gambleAmount: SomeFuckingValue, statType: "losses" | "wins") => {
			user.queuedBuilder()
				.max(`statistics.gambling.${statType}.mostMoney`, gambleAmount)
				.max(`statistics.gambling.totals.mostMoney`, gambleAmount)
				.increment('statistics.gambling.totals.count', '1')
				.increment(`statistics.gambling.${statType}.count`, '1')
				.increment(`statistics.gambling.${statType}.totalMoney`, String(gambleAmount));
		};

		for (let winner of this._endingInformation.winners) {
			const gambleLevel = winner.user.skills.gambling.level;
			const xpForLevel  = (50 * (gambleLevel / 10));
			const xpForAmount = ((Number(winner.takings) * 0.1) / gambleLevel);
			const xpGain      = Math.min(15_000, xpForAmount) + xpForLevel;

			setStatistics(winner.user, winner.takings, 'wins');

			winner.user.balanceManager().addToBalance(winner.takings, 'Won a bet');
			winner.user.skillManager().addXp('gambling', xpGain);

			await winner.user.executeQueued();
		}

		for (let loser of this._endingInformation.losers) {
			await setStatistics(loser.user, loser.amount, 'losses');
		}

	}

	/**
	 * Structure the discord message embed that will be sent at different times.
	 *
	 * @returns {MessageEmbed}
	 * @private
	 */
	private createBetMessage(): MessageEmbed {
		const bettingInfo = new MessageEmbed().setColor(this._tickColors[0]);

		bettingInfo.addField('Red: ', this.formatBettersForMessage(GamblingColor.RED));
		bettingInfo.addField('Black: ', this.formatBettersForMessage(GamblingColor.BLACK));

		bettingInfo.addField('Pot Total: ', this.totalInPot(), true);

		if (this._status === GamblingStatus.STARTING) {
			bettingInfo.setColor(this.getTickColor());
			bettingInfo.addField('Ends In:', this.getCountdownTimeLeft(), true);
			bettingInfo.addField('Info', 'You can join the bet by using /gamble. The color that wins will take the money from the losers.');
		}

		if (this._status === GamblingStatus.ENDED) {
			bettingInfo.setColor(this._winningColor === GamblingColor.RED ? 'RED' : 'NOT_QUITE_BLACK');

			bettingInfo.addField('Winning Color: ', GamblingColor[this._winningColor].toUpperCase(), true);

			let winners: string[] | string = this._endingInformation.winners.map(
				b => `- <@!${b.user.id}> | ${formatMoney(b.takings)}`,
			);

			winners = (winners.length ? winners.join('\n') : 'No winners');

			bettingInfo.addField('Winners: ', winners);

			if (this._endingInformation.botTookWinnings) {
				bettingInfo.addField('Info', 'Nobody won this bet, so the bot will keep the winnings. You can use /hack to attempt to steal some of this balance.', false);
			}
		}

		return bettingInfo;
	}

	/**
	 * Create the bet information embed message
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	private async sendBetMessage() {
		this._embed = this.createBetMessage();

		this._betMessage = await this._channel.send(this._embed);
	}

	/**
	 * Update the existing bet information embed
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	private async updateBetMessage() {
		if (!this._betMessage)
			return;

		this._embed = this.createBetMessage();

		await this._betMessage.edit(this._embed);
	}

	/**
	 * Get all bets that were created for x color
	 *
	 * @param {GamblingColor} color
	 * @returns {Bet[]}
	 * @private
	 */
	private bettersForColor(color: GamblingColor): Bet[] {
		return this._betters.filter(bet => bet.color === color);
	}

	/**
	 * Format a list of users who placed a bet against x color
	 *
	 * @param {GamblingColor} color
	 * @returns {string}
	 * @private
	 */
	private formatBettersForMessage(color: GamblingColor) {
		const betters = this.bettersForColor(color).map(
			b => `- <@!${b.user.id}> | ${formatMoney(b.amount)}`,
		);

		if (!betters.length) {
			return 'No bets.';
		}

		return betters.join('\n');
	}

	/**
	 * When the betting countdown has started send the bet information embed
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _onStarted() {
		await this.sendBetMessage();
	}

	/**
	 * For each tick on the countdown, send an updated embed
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _countdown() {
		await this.updateBetMessage();
	}

	/**
	 * When the countdown has ended, update the embed and pay the winners.
	 *
	 * @returns {Promise<void>}
	 * @private
	 */
	private async _onEnded() {
		await this.finishGambling();
		await this.updateBetMessage();
	}

	/**
	 * Get the total in the gambling bot
	 *
	 * @param {GamblingColor} color
	 * @returns {string}
	 * @private
	 */
	private totalInPot(color?: GamblingColor) {
		let total = this._betters
			.filter(b => color ? b.color === color : true)
			.map(b => numbro(b.amount))
			.reduce((previousValue: Numbro, currentValue: Numbro, currentIndex: number, array: Numbro[]) => {
				return previousValue.add(currentValue.value());
			}, numbro('0'))
			.value();

		return formatMoney(total);
	}

	getUsersJoinedCount() {
		return this._betters.length;
	}

	private smallestBet() {
		if (this._betters.length === 0) {
			return null;
		}

		return this._betters
			.map(b => numbro(b.amount))
			.reduce((previousValue: Numbro, currentValue: Numbro) => {
				if (previousValue.value() < currentValue.value()) {
					return previousValue;
				}

				return currentValue;
			}).value();
	}

	private minimumBet() {
		const smallestBet = this.smallestBet();

		return (smallestBet === null ? 0 : smallestBet * 0.7);
	}

	private getTotalBetAmount(user: User, amount: SomeFuckingValue): SomeFuckingValue {
		const existingBet = this.getUserBet(user);

		if (!existingBet) {
			return amount;
		}

		return numbro(existingBet.amount).add(Number(amount)).value();
	}

}
