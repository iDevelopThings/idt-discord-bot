import {GuildMember} from "discord.js";
import {Decimal128} from "mongodb";
import {guild} from "../../Util/Bot";
import User from "./User";
import {IDiscordUserInformation, IUserStatistics} from "./UserInformationInterfaces";

export default class UserManager {

	static async createUser(discordId: string) {
		const discordUser = await this.getDiscordUserInformation(discordId);

		return await User.create<User>({
			...discordUser,
			statistics     : this.defaultStatistics(),
			balances       : {
				balance  : 1000,
				invested : 50
			},
			cooldowns      : {},
			skills         : {
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
			preferences    : {
				botDmMessages : true,
			},
			balanceHistory : [],
			createdAt      : new Date(),
			updatedAt      : new Date()
		});
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
			avatar        : discordUser.user.avatarURL({format : 'png'}),
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
					mostMoney : 0,
				},
				wins   : {
					totalMoney : 0,
					mostMoney  : 0,
					count      : 0,
				},
				losses : {
					totalMoney : 0,
					mostMoney  : 0,
					count      : 0,
				},
			},
			activity : {
				messagesSent : 0
			}
		};
	}
}
