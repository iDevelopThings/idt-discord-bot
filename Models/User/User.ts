import {GuildMember} from "discord.js";
import {FilterQuery, ObjectId, UpdateQuery} from "mongodb";
import {guild} from "../../Util/Bot";
import {collection} from "../ModelHelper";
import {ITimeStates} from "./Cooldown";
import {ISkill} from "./Skills";
import {UserInstance} from "./UserInstance";

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

export interface IUser extends IDiscordUserInformation {
	_id: ObjectId;
	balances: IBalances;
	statistics: IUserStatistics;
	cooldowns: ITimeStates;
	preferences: IPreferences;
	skills: ISkills;
	createdAt: Date;
	updatedAt: Date;
	leftAt: Date;
}

export class User {

	static collection() {
		return collection<IUser>('users');
	}

	static async get(discordId: string): Promise<UserInstance> {

		let user = await this.collection().findOne({
			id : discordId
		});

		if (!user) {
			user = await this.createUser(discordId);
		}

		return new UserInstance(user);
	}

	static async createUser(discordId: string) {
		const discordUser = await this.getDiscordUserInformation(discordId);

		const createdUser = await this.collection().insertOne({
			...discordUser,
			statistics  : this.defaultStatistics(),
			balances    : {
				balance  : '1000',
				invested : '50'
			},
			cooldowns   : {},
			skills      : {
				chatting  : {
					xp    : 0,
					level : 1
				},
				gambling  : {
					xp    : 0,
					level : 1
				},
				hacking   : {
					xp    : 0,
					level : 1
				},
				investing : {
					xp    : 0,
					level : 1
				},
			},
			preferences : {
				botDmMessages : true,
			},
			createdAt   : new Date(),
			updatedAt   : new Date(),
			leftAt      : null
		});

		return this.collection().findOne({_id : createdUser.insertedId});
	}

	static async update(filter: FilterQuery<IUser>, values: UpdateQuery<IUser> | Partial<IUser>, getUpdatedInfo: boolean = false) {

		if ((values as any)?.updatedAt) {
			delete (values as any).updatedAt;
		}

		const queryValues = <UpdateQuery<IUser>>values;

		values = {
			$set         : values,
			$currentDate : {'updatedAt' : true}
		};

		const isManualUpdate = !!(queryValues?.$set || queryValues?.$currentDate);

		if (isManualUpdate) {
			values = queryValues;
		}

		const updated = await this.collection().updateOne(
			filter, values
		);

		if (!getUpdatedInfo) {
			return;
		}

		const user = await this.collection().findOne(filter);

		return new UserInstance(user);
	}

	static async getDiscordUser(discordId): Promise<GuildMember> {
		const discordUser = await guild().members.fetch(discordId);

		if (!discordUser) {
			throw new Error('Cannot get discord user info from discordjs to insert into db.');
		}

		return discordUser;
	}

	static async getDiscordUserInformation(discordId: string): Promise<IDiscordUserInformation> {
		const discordUser = await this.getDiscordUser(discordId);

		return {
			id            : discordUser.id,
			color         : discordUser.displayHexColor,
			avatar        : discordUser.user.avatarURL(),
			discriminator : discordUser.user.discriminator,
			displayName   : discordUser.displayName,
			username      : discordUser.user.username
		};
	}

	private static defaultStatistics(): IUserStatistics {
		return {
			balance  : {
				mostInvested    : '0',
				mostLostToTaxes : '0',
			},
			gambling : {
				totals : {
					count     : 0,
					mostMoney : '0',
				},
				wins   : {
					totalMoney : '0',
					mostMoney  : '0',
					count      : 0,
				},
				losses : {
					totalMoney : '0',
					mostMoney  : '0',
					count      : 0,
				},
			},
			activity : {
				messagesSent : 0
			}
		};
	}
}

export default User;
