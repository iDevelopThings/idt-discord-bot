import {ObjectId} from "mongodb";

import Activities, {ActivityName, IActivities} from "./Activities";
import Balance from "./Balance";
import Cooldown, {ITimeStates} from "./Cooldown";
import Skills from "./Skills";
import {IBalanceHistory, IBalances, IPreferences, ISkills, IUser, IUserStatistics, User} from "./User";


export class UserInstance implements IUser {

	public _id: ObjectId;
	public id: string;
	public displayName: string;
	public username: string;
	public avatar: string;
	public discriminator: string;
	public color: string;
	public balances: IBalances;
	public balanceHistory : IBalanceHistory[];
	public statistics: IUserStatistics;
	public cooldowns: ITimeStates;
	public preferences: IPreferences;
	public activities: {[key : string] : IActivities} //Record<ActivityName, IActivities>;
	public skills: ISkills;
	public createdAt: Date;
	public updatedAt: Date;
	public leftAt: Date;

	constructor(user: IUser) {
		Object.assign(this, user);

		if(!user?.balanceHistory){
			this.balanceHistory = []
		}
	}

	skillManager(): Skills {
		return new Skills(this);
	}

	cooldownManager(): Cooldown {
		return new Cooldown(this);
	}

	balanceManager(): Balance {
		return new Balance(this);
	}

	activityManager(): Activities {
		return new Activities(this);
	}

	/**
	 * We allow the user to change some settings
	 * Like if they can be dmed by the bot or not for certain things...
	 *
	 * @param {keyof IPreferences} name
	 * @returns {boolean}
	 */
	preference(name: keyof IPreferences): boolean {
		const pref = this.preferences[name];

		if (pref === undefined) return true;

		return pref;
	}

	async save(getUpdatedInfo: boolean = false) {
		const values = Object.assign({}, this);

		const user = await User.update({_id : this._id}, values, getUpdatedInfo);

		if (user && getUpdatedInfo)
			Object.assign(this, user);
	}

	toString() {
		return `<@${this.id}>`;
	}
}
