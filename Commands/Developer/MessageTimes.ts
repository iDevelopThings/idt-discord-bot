import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {getChannelById, guild, guildId} from "../../Util/Bot";
import {adminPermissionsForCommand, isAdmin} from "../../Util/Role";
import {getNewSpamInflictedXp, sendSpamLogs} from "../../Util/SpamShit";

export default class MessageTimes extends SlashCommand {
	constructor(creator) {
		super(creator, {
			deferEphemeral    : true,
			guildIDs          : guildId,
			name              : 'messagetimes',
			description       : 'Dev Commands',
			defaultPermission : false,
			permissions       : adminPermissionsForCommand(),
			options           : [
				{
					name        : 'user',
					description : 'user',
					type        : CommandOptionType.USER,
					required    : true,
				}
			]
		});
		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		if (!isAdmin(ctx.member)) {
			return "You cannot use this command";
		}



		return 'boosh';

	}


}

export interface IBalanceOptions {
	user?: string;
	amount?: string;
}
