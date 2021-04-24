import {Decimal128} from "mongodb";
import {ISkill} from "./Skills";

export interface IDiscordUserInformation {
	id: string;
	displayName: string;
	username: string;
	discriminator: string;
	avatar: string;
	color: string;
}

export interface IUserStatistics {
	balance: {
		mostInvested: string | number | Decimal128;
		mostLostToTaxes: string | number | Decimal128;
	};
	gambling: {
		totals: {
			count: number;
			mostMoney: number;
		};
		wins: {
			totalMoney: number;
			mostMoney: number;
			count: number;
		};
		losses: {
			totalMoney: number;
			mostMoney: number;
			count: number;
		};
	};
	activity: {
		messagesSent: number;
	}
}

export interface IBalances {
	balance: number;
	invested: number;
}

export interface ISkills {
	gambling: ISkill;
	hacking: ISkill;
	chatting: ISkill;
	investing: ISkill;
}

export interface IPreferences {
	botDmMessages: boolean;
}

export interface IBalanceHistory {
	amount: string | number | Decimal128;
	balanceType: keyof IBalances;
	typeOfChange: BalanceHistoryChangeType;
	reason: string;
}

export enum BalanceHistoryChangeType {
	ADDED   = 'added',
	REMOVED = 'removed'
}


export enum StatisticsKeys {
	MOST_INVESTED               = "statistics.balance.mostInvested",
	MOST_LOST_TO_TAXES          = "statistics.balance.mostLostToTaxes",
	GAMBLING_TOTALS_COUNT       = "statistics.gambling.totals.count",
	GAMBLING_MOST_MONEY         = "statistics.gambling.totals.mostMoney",
	GAMBLING_WINS_TOTAL_MONEY   = "statistics.gambling.wins.totalMoney",
	GAMBLING_WINS_MOST_MONEY    = "statistics.gambling.wins.mostMoney",
	GAMBLING_WINS_COUNT         = "statistics.gambling.wins.count",
	GAMBLING_LOSSES_TOTAL_MONEY = "statistics.gambling.losses.totalMoney",
	GAMBLING_LOSSES_MOST_MONEY  = "statistics.gambling.losses.mostMoney",
	GAMBLING_LOSSES_COUNT       = "statistics.gambling.losses.count",
	ACTIVITY_MESSAGES_SENT      = "statistics.activity.messagesSent"
}
