import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext, {MessageOptions} from "slash-create/lib/context";
import Activity, {ActivityType} from "../../Handlers/Activities/Activity";
import {activityList} from "../../Handlers/Activities/ActivityList";
import {ActivityName} from "../../Models/User/Activities";
import User from "../../Models/User/User";
import {getChannelById, guildId, isOneOfChannels} from "../../Util/Bot";
import {formatMoney} from "../../Util/Formatter";

export default class RunActivity extends SlashCommand {
	constructor(creator) {
		super(creator, {
			deferEphemeral : true,
			guildIDs       : guildId,
			name           : 'activity',
			description    : 'Start an activity which will run over x hours, you will lose or gain /balance.',
			options        : [
				{
					name        : 'start',
					description : 'Start an activity',
					type        : CommandOptionType.SUB_COMMAND_GROUP,
					options     : [
						{
							name        : 'legal',
							description : 'Start a legal activity',
							type        : CommandOptionType.SUB_COMMAND,
							options     : [
								{
									name        : 'type',
									description : 'The activity to start',
									required    : true,
									type        : CommandOptionType.STRING,
									choices     : Activity.activitiesForCommandChoices(ActivityType.LEGAL)
								}
							]
						},
						{
							name        : 'illegal',
							description : 'Start an illegal activity',
							type        : CommandOptionType.SUB_COMMAND,
							options     : [
								{
									name        : 'type',
									description : 'The activity to start',
									required    : true,
									type        : CommandOptionType.STRING,
									choices     : Activity.activitiesForCommandChoices(ActivityType.ILLEGAL)
								}
							]
						},
						{
							name        : 'heist',
							description : 'Start a heist',
							type        : CommandOptionType.SUB_COMMAND,
							options     : [
								{
									name        : 'type',
									description : 'The heist to start',
									required    : true,
									type        : CommandOptionType.STRING,
									choices     : Activity.activitiesForCommandChoices(ActivityType.HEIST)
								}
							]
						},
					]
				},
				{
					name        : 'list',
					description : 'List all activities',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'type',
							description : 'The type of activity',
							required    : true,
							type        : CommandOptionType.INTEGER,
							choices     : [
								{name : 'Legal', value : ActivityType.LEGAL},
								{name : 'Illegal', value : ActivityType.ILLEGAL},
								{name : 'Heist', value : ActivityType.HEIST},
							]
						}
					]
				}
			]
		});

		this.filePath = __filename;
	}

	async run(ctx: CommandContext): Promise<MessageOptions | string> {
		const user = await User.getOrCreate(ctx.user.id);

		if (!isOneOfChannels(ctx.channelID, 'activities')) {
			return 'You can only use /activity commands in the activities channel.';
		}

		switch (ctx.subcommands[0]) {
			case 'start':
				return this.startActivity(ctx, user);
			case 'list':
				return this.listActivities(ctx, user);
		}
	}

	async startActivity(ctx: CommandContext, user: User) {
		const options          = ctx.options.start as unknown as IStartOptions;
		const handler          = user.activityManager().handlerForActivity(
			options.legal?.type ?? options.illegal?.type ?? options.heist?.type
		);
		const {isAble, reason} = await handler.canStart(user);

		if (!isAble) {
			return reason;
		}

		await handler.start(user);

		return `You payed ${formatMoney(handler.startingCost().value())} upfront and started the ${handler.title()}.`;
	}

	private async listActivities(ctx: CommandContext, user: User) {
		const options = ctx.options.list as unknown as IListOptions;
		const embeds  = [];

		for (const activity of activityList) {
			if (activity.class.type !== options.type) {
				continue;
			}

			const instance = activity.classInstance(user);
			const chance   = instance.getCompletionChances();

			const hasActive = user.activityManager().hasActivity(instance.name());
			const endsIn    = user.activityManager().timeRemaining(instance.name());

			embeds.push(
				new MessageEmbed()
					.setTitle(instance.title())
					.setColor(activity.color)
					.addField('Starting Cost: ', formatMoney(instance.startingCost().value()))
					.addField('Min', '↓')
					.addField('Min Percent', `${chance.regular.min}-${chance.lucky.min}`, true)
					.addField('Min Money(based on %)', `${formatMoney(chance.regular.min * chance.money.min)}-${formatMoney(chance.lucky.min * chance.money.min)}`, true)
					.addField('Max', '↓')
					.addField('Max Percent', `${chance.regular.max}-${chance.lucky.max}`, true)
					.addField('Max Money(based on %)', `${formatMoney(chance.regular.max * chance.money.max)}-${formatMoney(chance.lucky.max * chance.money.max)}`, true)
					.addField('Your activity', '↓')
					.addField('Is active?', hasActive ? 'Yes' : 'No', true)
					.addField('Ends In', hasActive ? endsIn : 'Not started.', true)
			);
		}

		if (embeds.length === 0) {
			return 'There are no activities of this type available yet :(';
		}

		await ctx.defer(false);
		await ctx.delete();

		await getChannelById(ctx.channelID).send(embeds);
	}
}

export interface IStartOptions {
	legal?: {
		type: ActivityName
	};
	illegal?: {
		type: ActivityName
	};
	heist?: {
		type: ActivityName
	};
}

export interface IListOptions {
	type: ActivityType;
}
