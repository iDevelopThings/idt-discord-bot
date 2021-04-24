import Investment from "../../Handlers/Investment";
import {formatMoney, numbro} from "../../Util/Formatter";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import User from "./User";
import {IBalanceHistory, IBalances} from './UserInformationInterfaces';

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
		amount = NumberInput.someFuckingValueToString(amount);

		return numbro(this.user.balances[type]).value() >= numbro(amount).value();
	}

	deductFromBalance(amount: string, type: keyof IBalances = 'balance') {
		return this.user.queryBuilder()
			.where({_id : this.user._id})
			.decrement(
				`balances.${type}`,
				amount
			);
	}

	addToBalance(amount: string, type: keyof IBalances = 'balance') {
		return this.user.queryBuilder()
			.where({_id : this.user._id})
			.increment(
				`balances.${type}`,
				amount
			);
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
		return this.user.queryBuilder()
			.where({_id : this.user._id})
			.update({
				$push : {
					balanceHistory : history
				} as any
			});
	}

	/**
	 * Claim investment money, used by the bot every 30m
	 * automatically & by the /investment claim command
	 *
	 * @returns {Promise<void>}
	 */
	async claimInvestment() {
		const income = this.user.balanceManager().income();

		await this.user.balanceManager().addToBalance(String(income));
		await this.user.balanceManager().changed({
			amount       : String(income),
			balanceType  : "balance",
			typeOfChange : "added",
			reason       : `Claimed investment income`
		});
		await this.user.cooldownManager().setUsed('claim');

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



}
