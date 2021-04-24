import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import Skills, {AvailableSkills, SkillName} from "../../Models/User/Skills";
import User from "../../Models/User/User";
import {guildId} from "../../Util/Bot";
import {formatMoney, InvalidNumberResponse, isValidNumber} from "../../Util/Formatter";
import {adminPermissionsForCommand, isAdmin} from "../../Util/Role";

export default class Give extends SlashCommand {

	constructor(creator) {
		super(creator, {
			deferEphemeral    : true,
			guildIDs          : guildId,
			name              : 'give',
			description       : 'Admin give command',
			defaultPermission : false,
			permissions       : adminPermissionsForCommand(),
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
				{
					name        : 'level',
					description : 'Give a user a level',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'User to give a level to',
							type        : CommandOptionType.USER,
							required    : true,
						},
						{
							name        : 'skill',
							description : 'Skill to set',
							type        : CommandOptionType.STRING,
							required    : true,
							choices     : Object.keys(AvailableSkills).map(
								key => ({name : AvailableSkills[key].title, value : key})
							)
						},
						{
							name        : 'level',
							description : 'Level to set',
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

		if(!isAdmin(ctx.member)){
			return "You cannot use this command";
		}

		if (ctx.subcommands.includes('balance')) {
			const options = ctx.options.balance as { user: string; amount: string; };

			const valid = isValidNumber(options.amount);
			if (valid !== InvalidNumberResponse.IS_VALID) {
				return valid;
			}

			const usr = await User.getOrCreate(options.user);

			usr.balanceManager().addToBalance(options.amount);
			usr.balanceManager().changed({
				amount       : options.amount,
				balanceType  : "balance",
				typeOfChange : "added",
				reason       : `Given money by ${ctx.user.username}`
			});
			await usr.save();

			return `Given ${formatMoney(options.amount)} to <@${usr.id}>`;
		}


	}

}
