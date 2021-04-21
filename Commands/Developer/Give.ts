import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {guild, guildId} from "../../Util/Bot";
import {formatMoney, InvalidNumberResponse, isValidNumber} from "../../Util/Formatter";

const ownerRole = guild().roles.cache.find(r => (r.name === 'Owner' || r.name === 'Admin'));

const permissions    = {};
permissions[guildId] = [
	{
		id         : ownerRole.id,
		type       : 1,
		permission : true,
	},
	//	{
	//		id         : beta.id,
	//		type       : 1,
	//		permission : true,
	//	}
];

export default class Give extends SlashCommand {

	constructor(creator) {
		super(creator, {
			deferEphemeral    : true,
			guildIDs          : guildId,
			name              : 'give',
			description       : 'Admin give command',
			defaultPermission : true,
			permissions       : permissions,
			options           : [
				{
					name        : 'balance',
					description : 'Give balance to a user',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'User to give balance to',
							type        : CommandOptionType.USER,
							required    : true,
						},
						{
							name        : 'amount',
							description : 'Amount to give',
							type        : CommandOptionType.STRING,
							required    : true,
						}
					]
				},

			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {

		if (ctx.subcommands.includes('balance')) {
			const options = ctx.options.balance as { user: string; amount: string; };

			const valid = isValidNumber(options.amount);
			if (valid !== InvalidNumberResponse.IS_VALID) {
				return valid;
			}

			const usr = await User.get(options.user);

			usr.balanceManager().addToBalance(options.amount);
			await usr.save();

			return `Given ${formatMoney(options.amount)} to <@${usr.id}>`;
		}


	}

}
