import {default as numbroInst} from "numbro";
import Balance from "../Models/User/Balance";
import Numbro = numbroInst.Numbro;
import Format = numbroInst.Format;
import {lowerCase, upperCase, upperFirst} from 'lodash';
import {dayjs} from "./Date";

export {Numbro};

const _numbro = require('numbro');

export const numbro = (i?): Numbro => {
	_numbro.setDefaults({
		average          : true,
		mantissa         : 2,
		optionalMantissa : true,
		currencyPosition : "prefix",

	});
	_numbro.zeroFormat('0');

	return _numbro(i);
};

export const formatXp = (xp: string) => {
	return numbro(xp).format({
		average          : true,
		mantissa         : 2,
		optionalMantissa : true,
	}).toString();
};

export const numbroParse = (i: string, options?: Format | string) => {
	return _numbro.unformat(i.toLocaleLowerCase(), options);
};

export const formatMoney = (i, specific = false) => {
	const value = numbro(i).formatCurrency({
		average          : specific === false,
		mantissa         : 2,
		optionalMantissa : specific === false,
		currencyPosition : "prefix",
	});

	if (value === '$NaN' || value === '-$aN') {
		return '$0';
	}

	return value;
};

export const formatPercentage = (i) => {
	return numbro(i).format({
		average          : false,
		mantissa         : 2,
		optionalMantissa : false,
		output           : "percent"
	});
};

export const percentOf = (i, percent: string): string => {
	percent = numbroParse(percent, {base : "decimal", output : "percent"});
	return numbro(i).multiply(Number(percent)).value().toString();
};

export enum InvalidNumberResponse {
	MUST_BE_MORE_THAN_ZERO = 'Amount should be more than 0.',
	INVALID_AMOUNT         = 'Invalid amount.',
	NOT_ENOUGH_BALANCE     = 'Not enough money.',
	NOT_ENOUGH_INVESTMENT  = 'Not enough investment.',
	IS_VALID               = 'it is correcto'
}

export const isValidNumber = (amount: string, balanceManager?: Balance): InvalidNumberResponse | string => {
	const amountFormatted = numbroParse(amount, {output : 'currency'});

	if (amountFormatted <= 0) {
		return InvalidNumberResponse.MUST_BE_MORE_THAN_ZERO;
	}

	if (!amountFormatted) {
		return InvalidNumberResponse.INVALID_AMOUNT;
	}

	//	if (balanceManager) {
	//		if (!balanceManager.hasBalance(numbro(amount).value())) {
	//			return InvalidNumberResponse.NOT_ENOUGH_BALANCE + ` You need ${formatMoney(amount, true)}.`;
	//		}
	//	}

	return InvalidNumberResponse.IS_VALID;
};


export const title = (string) => {
	return upperFirst(lowerCase(upperCase(string)));
};

export const formatDate = (date: Date, format: string = 'DD/MM/YYYY h:mm:ssa Z') => {
	return dayjs(date).format(format);
};
