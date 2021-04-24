import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext, {MessageOptions} from "slash-create/lib/context";
import {ActivityName} from "../../Models/User/Activities";
import User from "../../Models/User/User";
import {guildId} from "../../Util/Bot";

export const illegalActivityChoices = [
	{
		name  : 'Raid local cannabis farm',
		value : 'raid_local_cannabis'
	}
];

type IllegalActivity = {
	type: ActivityName;
}

export default class RunIllegalActivity extends SlashCommand {
	constructor(creator) {
		super(creator, {
			deferEphemeral : true,
			guildIDs       : guildId,
			name           : 'run',
			description    : 'Start an activity which will run over x hours, you will lose or gain /balance.',
			options        : [
				{
					name        : 'illegal_activity',
					description : 'Snekky snekky',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'type',
							description : 'The type of activity',
							required    : true,
							type        : CommandOptionType.STRING,
							choices     : illegalActivityChoices
						}
					]
				}
			]
		});

		this.filePath = __filename;
	}

	async run(ctx: CommandContext): Promise<MessageOptions | string> {
		const user = await User.getOrCreate(ctx.user.id);

		switch(ctx.subcommands[0]) {
			case 'illegal_activity':
				return this.startIllegalActivity(ctx, user);
		}
	}

	async startIllegalActivity(ctx: CommandContext, user: User) {
		const options = ctx.options.illegal_activity as IllegalActivity;
		const handler          = user.activityManager().handlerForActivity(options.type);
		const {isAble, reason} = await handler.canStart(user);

		if (!isAble) {
			return reason;
		}

		await handler.start(user);

		return 'Yeet';
	}
}
