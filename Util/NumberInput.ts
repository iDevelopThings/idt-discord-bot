import {Decimal128} from "mongodb";
import User from "../Models/User/User";
import {IBalances} from "../Models/User/UserInformationInterfaces";
import {formatMoney, InvalidNumberResponse, numbro, numbroParse, percentOf} from "./Formatter";

export type SomeFuckingValue = string | number | Decimal128;

export default class NumberInput {
	private _value: string = "0";

	private _balanceType: keyof IBalances = "balance";

	private _validationError: InvalidNumberResponse | string = null;

	constructor(private input: string, private user?: User) {}

	forBalance(type: keyof IBalances) {
		this._balanceType = type;

		return this;
	}

	parse() {
		let value = NumberInput.someFuckingValueToString(this.input);

		// If the number is a %, we'll get x percent of the users balance
		if (typeof value === 'string' && value.includes('%')) {
			const balance = NumberInput.someFuckingValueToString(this.user.balances[this._balanceType]);
			value         = percentOf(
				balance,
				value
			);
		}

		const amountFormatted = numbroParse(value, {output : 'currency'});

		if (amountFormatted <= 0) {
			this._validationError = InvalidNumberResponse.MUST_BE_MORE_THAN_ZERO;
			return this;
		}

		if (!amountFormatted) {
			this._validationError = InvalidNumberResponse.INVALID_AMOUNT;
			return this;
		}

		if (!this.user.balanceManager().hasBalance(amountFormatted, this._balanceType)) {
			if (this._balanceType === 'invested') {
				this._validationError = InvalidNumberResponse.NOT_ENOUGH_INVESTMENT
					+ ` You need ${formatMoney(amountFormatted, true)}.`;
			} else {
				this._validationError = InvalidNumberResponse.NOT_ENOUGH_BALANCE
					+ ` You need ${formatMoney(amountFormatted, true)}.`;
			}

			return this;
		}

		this._value = amountFormatted;

		return this;
	}

	isValid() {
		return this._validationError === null;
	}

	error() {
		return this._validationError;
	}

	value(): string {
		return this._value;
	}

	parseFuckedUpShit() {
		let value = NumberInput.someFuckingValueToString(this.input);

		// If the number is a %, we'll get x percent of the users balance
		if (typeof value === 'string' && value.includes('%')) {
			const balance = NumberInput.someFuckingValueToString(this.user.balances[this._balanceType]);

			value = percentOf(
				balance,
				value
			);
		}

		const amountFormatted = numbroParse(value, {output : 'currency'});

		if (amountFormatted <= 0) {
			this._validationError = InvalidNumberResponse.MUST_BE_MORE_THAN_ZERO;

			return this;
		}

		if (!amountFormatted) {
			this._validationError = InvalidNumberResponse.INVALID_AMOUNT;

			return this;
		}

		this._value = amountFormatted;

		return this;
	}

	static convert(value: any, user: User) {
		if (value instanceof Decimal128) {
			return value;
		}

		if (typeof value === 'number') {
			return Decimal128.fromString(String(value));
		}

		const input = new NumberInput(value, user).parseFuckedUpShit();

		if (!input.isValid()) {
			if (input._validationError === InvalidNumberResponse.MUST_BE_MORE_THAN_ZERO) {
				return Decimal128.fromString('0');
			}
			debugger
		}

		const parsed = numbro(input.value()).format({
			mantissa : 2,
			average  : false,
			output   : "number"
		}).toString();

		return Decimal128.fromString(parsed);
	}

	static someFuckingValueToString(input: SomeFuckingValue): string {
		if (typeof input === 'number') {
			return String(input);
		}

		if (input instanceof Decimal128) {
			return input.toString();
		}

		return input;
	}

	static someFuckingValueToInt(input: SomeFuckingValue): number {
		if (typeof input === 'number') {
			return input;
		}

		return Number(input);
	}
}
