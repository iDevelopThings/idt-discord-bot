import {Decimal128} from "mongodb";
import Investment from "../../Handlers/Investment";
import {formatMoney, numbro} from "../../Util/Formatter";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import User from "./User";
import {IBalanceHistory, IBalances, BalanceHistoryChangeType} from './UserInformationInterfaces';


export default class Balance {

	constructor(private user: User) {}

	hasMoney(): boolean {
		return this.hasBalance('1', 'balance') || this.hasBalance('1', 'invested');
	}

	hasMoneyType(): keyof IBalances {
		if (this.hasBalance('1', 'balance')) {
			return 'balance';
		}

		if (this.hasBalance('1', 'invested')) {
			return 'invested';
		}
	}

	hasBalance(amount: SomeFuckingValue, type: keyof IBalances = 'balance') {
		amount        = NumberInput.someFuckingValueToString(amount);
		const balance = NumberInput.someFuckingValueToString(this.user.balances[type]);

		return numbro(balance).value() >= numbro(amount).value();
	}

	deductFromBalance(amount: SomeFuckingValue, reason: string, type: keyof IBalances = 'balance') {
		amount = NumberInput.someFuckingValueToString(amount);

		this.user.queuedBuilder().decrement(`balances.${type}`, amount);

		this.changed({
			amount,
			balanceType  : type,
			typeOfChange : BalanceHistoryChangeType.REMOVED,
			reason,
		});

		return this.user;
	}

	addToBalance(amount: SomeFuckingValue, reason: string, type: keyof IBalances = 'balance') {
		amount = NumberInput.someFuckingValueToString(amount);

		this.user.queuedBuilder().increment(`balances.${type}`, amount);

		this.changed({
			amount,
			balanceType  : type,
			typeOfChange : BalanceHistoryChangeType.ADDED,
			reason,
		});

		return this.user;
	}

	/**
	 * If the user basically has no money/investment, they'll get a base of $50s
	 * @returns {boolean}
	 */
	canUseBaseIncome() {
		return numbro(this.user.balances.invested).value() < 50 || numbro(this.user.balances.balance).value() < 50;
	}

	/**
	 * Get the income that can be received from the invested balance
	 *
	 * @param {boolean} formatted
	 * @returns {string | number}
	 */
	income(formatted = false) {
		const invested = numbro(this.user.balances.invested).value();
		const returns  = Investment.returnsFor(invested) + 50;

		return formatted ? formatMoney(returns) : returns;
	}

	/**
	 *
	 * @param {IBalanceHistory} history
	 * @returns {Promise<boolean>}
	 */
	changed(history: IBalanceHistory) {
		if (!(history.amount instanceof Decimal128)) {
			history.amount = Decimal128.fromString(history.amount.toString());
		}

		return this.user.queryBuilder()
			.push<IBalanceHistory>('balanceHistory', history);
	}

	/**
	 * Claim investment money, used by the bot every 30m
	 * automatically & by the /investment claim command
	 *
	 * @returns {Promise<{number: number}>}
	 */
	async claimInvestment() {
		const income = this.income().toString();

		this.addToBalance(income, 'Claimed investment income');

		this.user.cooldownManager().setUsed('claim');

		await this.user.executeQueued();

		return {income};
	}

	handleMostInvested(amount: string) {
		const amountValue = numbro(amount).value();
		const currentMost = numbro(this.user.statistics.balance.mostInvested).value();

		if (amountValue < currentMost) {
			return;
		}

		this.user.queuedBuilder().increment(
			`statistics.balance.mostInvested`, String(amountValue - currentMost)
		);
	}


	public async cleanHistory() {
		if (this.user.balanceHistory.length < 50) {
			return false;
		}

		this.user.balanceHistory = this.user.balanceHistory.slice(-50);

		await User.getCollection<User>().updateOne(
			{_id : this.user._id},
			{$set : {balanceHistory : this.user.balanceHistory}}
		);

		return true;
	}
}
