import {ObjectId} from "mongodb";
import {id} from "../../Core/Database/ModelDecorators";
import Model from "../../Core/Database/Mongo/Model";
import Moderation from "../Moderation/Moderation";
import Activities, {IActivities} from "./Activities";
import Balance from "./Balance";
import Cooldown, {ITimeStates} from "./Cooldown";
import Skills from "./Skills";
import {IBalanceHistory, IBalances, IPreferences, ISkills, IUserStatistics} from "./UserInformationInterfaces";
import UserManager from "./UserManager";


export default class User extends Model<User> {

	@id
	_id: ObjectId;

	public id: string;
	public displayName: string;
	public username: string;
	public avatar: string;
	public discriminator: string;
	public color: string;
	public balances: IBalances;
	public balanceHistory: IBalanceHistory[] = [];
	public statistics: IUserStatistics;
	public cooldowns: ITimeStates;
	public preferences: IPreferences;
	public activities: { [key: string]: IActivities };
	public skills: ISkills;
	public createdAt: Date;
	public updatedAt: Date;


	static async getOrCreate(discordId: string): Promise<User> {
		let user = await User.findOne<User>({id : discordId});

		if (!user) {
			user = await UserManager.createUser(discordId);
		}

		return user;
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

	moderationManager(): Moderation {
		return new Moderation(this);
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

	toString() {
		return `<@${this.id}>`;
	}

}

