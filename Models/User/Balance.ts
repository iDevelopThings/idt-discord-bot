import Investment from "../../Handlers/Investment";
import {formatMoney, numbro} from "../../Util/Formatter";
import {IBalanceHistory, IBalances} from "./User";
import {UserInstance} from "./UserInstance";

export default class Balance {

	constructor(private user: UserInstance) {}

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

	hasBalance(amount: string, type: keyof IBalances = 'balance') {
		return numbro(this.user.balances[type]).value() >= numbro(amount).value();
	}

	deductFromBalance(amount: string, type: keyof IBalances = 'balance') {
		const finalAmount = numbro(this.user.balances[type])
			.subtract(numbro(amount).value())
			.value();

		if (Number.isNaN(finalAmount)) {
			this.user.balances[type] = '0';
			return;
		}

		if (finalAmount < 0) {
			this.user.balances[type] = '0';
		} else {
			this.user.balances[type] = String(finalAmount);
		}
	}

	addToBalance(amount: string, type: keyof IBalances = 'balance') {
		if (Number(amount) < 0) {
			throw new Error('You cannot add a minus to the balance');
		}

		const finalAmount = numbro(this.user.balances[type])
			.add(numbro(amount).value())
			.value();

		this.user.balances[type] = String(finalAmount);
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
	 * Store a balance change history log
	 * This is so we can track what happened/view a users change history
	 *
	 * @param {IBalanceHistory} history
	 */
	changed(history: IBalanceHistory) {
		this.user.balanceHistory.push(history);
	}

	/**
	 * Claim investment money, used by the bot every 30m
	 * automatically & by the /investment claim command
	 *
	 * @returns {Promise<void>}
	 */
	async claimInvestment() {
		const income = this.user.balanceManager().income();

		this.user.balanceManager().addToBalance(String(income));
		this.user.balanceManager().changed({
			amount       : String(income),
			balanceType  : "balance",
			typeOfChange : "added",
			reason       : `Claimed investment income`
		});
		await this.user.save();

		await this.user.cooldownManager().setUsed('claim');

		return {income};
	}

}
