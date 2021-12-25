import {Log} from "@envuso/common";
import {Type} from "class-transformer";
import {EmbedAuthorData, MessageEmbed} from "discord.js";
import {ObjectId} from "mongodb";
import Configuration from "../../Configuration";
import {id} from "../../Core/Database/ModelDecorators";
import Model from "../../Core/Database/Mongo/Model";
import DiscordJsManager from "../../Core/Discord/DiscordJsManager";
import {BaseInventoryItem} from "../../Handlers/Inventory/Item/BaseInventoryItem";
import {itemTypesTransformer} from "../../Handlers/Inventory/Item/ItemTypeTransformerObject";
import {ItemTypes} from "../../Handlers/Inventory/Item/ItemTypes";
import UserInventoryManager from "../../Handlers/Inventory/UserInventoryManager";
import {guild} from "../../Util/Bot";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import {XpCalculations} from "../../Util/SpamShit";
import Moderation from "../Moderation/Moderation";
import SentMessage from "../SentMessage";
import Activities, {IActivities} from "./Activities";
import Balance from "./Balance";
import Cooldown, {ITimeStates} from "./Cooldown";
import Skills from "./Skills";
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
	@Type(() => BaseInventoryItem, itemTypesTransformer)
	public inventory: ItemTypes[]                     = [];
	public skills: ISkills;
	public createdAt: Date;
	public updatedAt: Date;

	public isBot: boolean           = false;
	public spamInfo: XpCalculations = {
		is              : false,
		counter         : 0,
		fastMessaging   : false,
		lotsOfMessaging : false,
		xpReducer       : 0,
		durationAs      : {s : 0, h : 0,}
	};

	_balanceManager: Balance                = new Balance(this);
	_skillsManager: Skills                  = new Skills(this);
	_cooldownManager: Cooldown              = new Cooldown(this);
	_activitiesManager: Activities          = new Activities(this);
	_moderationManager: Moderation          = new Moderation(this);
	_inventoryManager: UserInventoryManager = new UserInventoryManager(this);

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

	inventoryManager(): UserInventoryManager {
		return this._inventoryManager;
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

	get embedAuthorInfo(): EmbedAuthorData {
		return {
			name    : this.displayName,
			iconURL : this.getAvatar(),
		};
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

	getAvatar() {
		return this.avatar ?? DiscordJsManager.client().user.avatarURL({format : "png"});
	}

	public async getLastMessageTimes() {
		const messages = await SentMessage
			.where<SentMessage>({authorId : this.id,})
			.setOptions({
				sort  : {
					authorId  : -1,
					createdAt : -1,
				},
				limit : Configuration.spamMessageHistoryLookBack
			})
			.get();


		return messages.map(m => m.createdAt);
	}

	public async getLastMessageTimesThisMinute() {
		const messages = await SentMessage
			.where<SentMessage>({
				authorId  : this.id,
				createdAt : {
					$gte : new Date((new Date().getTime() - 60000))
				}
			})
			.setOptions({
				sort  : {
					authorId  : -1,
					createdAt : -1,
				},
				limit : Configuration.spamMessageHistoryLookBack
			})
			.get();


		return messages.map(m => m.createdAt);
	}

	public spamCalcsEmbed() {
		const info = this.spamInfo;

		return new MessageEmbed()
			.setAuthor(this.embedAuthorInfo)
			.addField('Has spam reduction?', String(info.is), true)
			.addField('Xp reduction: ', String(info.xpReducer), true)
			.addField('Spam counter: ', info.counter.toString(), true)
			.addField('Is fast messaging: ', String(info.fastMessaging), true)
			.addField('Is lots of messaging: ', String(info.lotsOfMessaging), true)
			.addField('Duration in seconds:', info.durationAs.s.toString(), true)
			.addField('Duration in hours:', info.durationAs.h.toString(), true);
	}
}

