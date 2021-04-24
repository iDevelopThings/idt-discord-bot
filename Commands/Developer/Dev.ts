import {Decimal128} from "mongodb";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {guildId} from "../../Util/Bot";
import NumberInput from "../../Util/NumberInput";
import {adminPermissionsForCommand, isAdmin} from "../../Util/Role";

export default class Dev extends SlashCommand {
	constructor(creator) {
		super(creator, {
			deferEphemeral    : true,
			guildIDs          : guildId,
			name              : 'dev',
			description       : 'Dev Commands',
			defaultPermission : false,
			permissions       : adminPermissionsForCommand(),
			options           : [
				{
					name        : 'fixtypes',
					description : 'Fix the types of numbers',
					type        : CommandOptionType.SUB_COMMAND,
				},
			]
		});
		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		if (!isAdmin(ctx.member)) {
			return "You cannot use this command";
		}

		switch (ctx.subcommands[0]) {
			case 'fixtypes':
				return this.fixTypes(ctx);
		}
	}

	private async fixTypes(ctx: CommandContext) {

		const users = await User.where<User>({}).get();

		for (let user of users) {

			try {
				await user.collection().updateOne({
					_id : user._id,
				}, {
					$set : {
						'balances.balance'                      : NumberInput.convert(user.balances.balance, user),
						'balances.invested'                     : NumberInput.convert(user.balances.invested, user),
						'statistics.balance.mostInvested'       : NumberInput.convert(user.statistics.balance.mostInvested, user),
						'statistics.balance.mostLostToTaxes'    : NumberInput.convert(user.statistics.balance.mostLostToTaxes, user),
						'statistics.gambling.totals.count'      : NumberInput.convert(user.statistics.gambling.totals.count, user),
						'statistics.gambling.totals.mostMoney'  : NumberInput.convert(user.statistics.gambling.totals.mostMoney, user),
						'statistics.gambling.wins.totalMoney'   : NumberInput.convert(user.statistics.gambling.wins.totalMoney, user),
						'statistics.gambling.wins.mostMoney'    : NumberInput.convert(user.statistics.gambling.wins.mostMoney, user),
						'statistics.gambling.wins.count'        : NumberInput.convert(user.statistics.gambling.wins.count, user),
						'statistics.gambling.losses.totalMoney' : NumberInput.convert(user.statistics.gambling.losses.totalMoney, user),
						'statistics.gambling.losses.mostMoney'  : NumberInput.convert(user.statistics.gambling.losses.mostMoney, user),
						'statistics.gambling.losses.count'      : NumberInput.convert(user.statistics.gambling.losses.count, user),
						'statistics.activity.messagesSent'      : NumberInput.convert(user.statistics.activity.messagesSent, user),
					}
				});
			} catch (e) {
				debugger
			}

		}

	}
}

export interface IBalanceOptions {
	user?: string;
	amount?: string;
}
