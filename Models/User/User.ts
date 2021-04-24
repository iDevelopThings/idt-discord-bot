import {Log} from "@envuso/common";
import {ObjectId} from "mongodb";
import {id} from "../../Core/Database/ModelDecorators";
import Model from "../../Core/Database/Mongo/Model";
import {guild} from "../../Util/Bot";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import Moderation from "../Moderation/Moderation";
import Activities, {IActivities} from "./Activities";
import Balance from "./Balance";
import Cooldown, {ITimeStates} from "./Cooldown";
import Skills, {AvailableSkills} from "./Skills";
import {IBalanceHistory, IBalances, IPreferences, ISkills, IUserStatistics, StatisticsKeys} from "./UserInformationInterfaces";
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
	public balanceHistory: IBalanceHistory[]          = [];
	public statistics: IUserStatistics;
	public cooldowns: ITimeStates                     = {};
	public preferences: IPreferences;
	public activities: { [key: string]: IActivities } = {};
	public skills: ISkills;
	public createdAt: Date;
	public updatedAt: Date;

	_balanceManager: Balance       = new Balance(this);
	_skillsManager: Skills         = new Skills(this);
	_cooldownManager: Cooldown     = new Cooldown(this);
	_activitiesManager: Activities = new Activities(this);
	_moderationManager: Moderation = new Moderation(this);

	skillManager(): Skills {
		return this._skillsManager;
	}

	cooldownManager(): Cooldown {
		return this._cooldownManager;
	}

	balanceManager(): Balance {
		return this._balanceManager;
	}

	activityManager(): Activities {
		return this._activitiesManager;
	}

	moderationManager(): Moderation {
		return this._moderationManager;
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

	static async getOrCreate(discordId: string): Promise<User> {
		let user = await User.findOne<User>({id : discordId});

		if (!user) {
			user = await UserManager.createUser(discordId);
		}

		return user;
	}

	/**
	 * ->> Just keep scrolling, you saw nothing.
	 *
	 * Update a statistic using mongo $max so we don't need to do bigger than/less than comparisons
	 *
	 * Some stats only increment by one... so to save hassles, value is optional.
	 * If we're updating a single increment stat, then it will auto update by 1.
	 *
	 * @param {StatisticsKeys} type
	 * @param {SomeFuckingValue} value
	 */
	updateStatistic(type: StatisticsKeys, value?: SomeFuckingValue) {
		const updateByValue = NumberInput.someFuckingValueToString(value ?? "1");

		let typeOfUpdate: "max" | "inc" = "max";

		switch (type) {
			case StatisticsKeys.GAMBLING_TOTALS_COUNT:
			case StatisticsKeys.GAMBLING_WINS_COUNT:
			case StatisticsKeys.GAMBLING_LOSSES_COUNT:
			case StatisticsKeys.ACTIVITY_MESSAGES_SENT:
				typeOfUpdate = "inc";
				break;
			default :
				typeOfUpdate = "max";
		}

		if (typeOfUpdate === "max" && value === undefined) {
			throw new Error('Max update for statistic: ' + type + ' requires a value to be passed.');
		}

		if (typeOfUpdate === "max")
			this.queuedBuilder().max(type, updateByValue);

		if (typeOfUpdate === "inc")
			this.queuedBuilder().increment(type, updateByValue);
	}

	async sendDm(message: string) {
		const member = guild().members.cache.get(this.id);
		try {
			const dm = await member.createDM();

			await dm.send(message);
		} catch (error) {
			Log.error('Cannot dm user: ' + member.displayName);
		}
	}

}

