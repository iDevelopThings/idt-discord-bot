import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {guildId} from "../../Util/Bot";
import {numbroParse} from "../../Util/Formatter";
import {getRoles, hasRole, mapRolesToCommandPermissions} from "../../Util/Role";

export default class Mute extends SlashCommand {
	constructor(creator) {
		super(creator, {
			deferEphemeral    : true,
			guildIDs          : guildId,
			name              : 'mute',
			description       : 'Mute a User',
			defaultPermission : false,
			permissions       : mapRolesToCommandPermissions(getRoles(
				'owner',
				'admin',
				'vip in this bitch',
				'mod'
			)),
			options           : [
				{
					name        : 'user',
					description : 'User to mute',
					type        : CommandOptionType.USER,
					required    : true,
				},
				{
					name        : 'minutes',
					description : 'Number of minutes to mute the User for',
					type        : CommandOptionType.STRING,
					required    : true,
				},
				{
					name        : 'reason',
					description : 'Reason for muting the User',
					type        : CommandOptionType.STRING,
				}
			]
		});

		this.filePath = __filename;
	}

	async run(ctx: CommandContext) {
		if (!hasRole(ctx.member, 'owner', 'admin', 'vip in this bitch', 'mod')) {
			return 'You cannot use this command';
		}

		const {user : userId, minutes, reason} = ctx.options as {
			user: string,
			minutes: string,
			reason?: string
		};

		const valid = Math.ceil(numbroParse(minutes, {output : 'number'}));

		if (isNaN(valid) || valid < 0) {
			return 'Invalid minutes';
		}

		const user = await User.getOrCreate(userId);
		let result;

		if (valid === 0) {
			result = await user.moderationManager().unmute();
		} else {
			result = await user.moderationManager().mute(valid, reason, ctx.member.id);
		}

		if (!!result) {
			return result;
		}

		if (valid === 0) {
			return `${user.toString()} has been unmuted.`;
		}

		return `${user.toString()} has been muted for ${valid} minute(s).`;
	}
}
