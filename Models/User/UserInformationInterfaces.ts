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
		mostInvested: string;
		mostLostToTaxes: string;
	};
	gambling: {
		totals: {
			count: number;
			mostMoney: string;
		};
		wins: {
			totalMoney: string;
			mostMoney: string;
			count: number;
		};
		losses: {
			totalMoney: string;
			mostMoney: string;
			count: number;
		};
	};
	activity: {
		messagesSent: number;
	}
}

export interface IBalances {
	balance: string;
	invested: string;
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
	amount: string;
	balanceType: keyof IBalances;
	typeOfChange: "added" | "removed";
	reason: string;
}
