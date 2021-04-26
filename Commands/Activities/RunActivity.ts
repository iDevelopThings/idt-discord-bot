import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext, {MessageOptions} from "slash-create/lib/context";
import Activity, {ActivityType} from "../../Handlers/Activities/Activity";
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
					]
				},
				{
					name        : 'list',
					description : 'List all activities',
					type        : CommandOptionType.SUB_COMMAND,
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
			case "list":
				await this.listActivities(ctx, user);
		}
	}

	async startActivity(ctx: CommandContext, user: User) {
		const options          = ctx.options.start as unknown as IStartOptions;
		const handler          = user.activityManager().handlerForActivity(options.legal?.type ?? options.illegal?.type);
		const {isAble, reason} = await handler.canStart(user);

		if (!isAble) {
			return reason;
		}

		await handler.start(user);

		return `You payed ${formatMoney(handler.startingCost().value())} upfront and started the ${handler.title()}.`;
	}

	private async listActivities(ctx: CommandContext, user: User) {
		const embeds = [];

		for (let illegalActivityChoice of Activity.activities()) {
			const instance = illegalActivityChoice.classInstance(user);
			const chance   = instance.getCompletionChances();

			const hasActive = user.activityManager().hasActivity(instance.name());
			const endsIn    = user.activityManager().timeRemaining(instance.name());

			embeds.push(
				new MessageEmbed()
					.setTitle(instance.title())
					.setColor(illegalActivityChoice.color)
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

		await ctx.defer(false);
		await ctx.delete();

		await getChannelById(ctx.channelID).send(embeds);
	}
}

export interface IStartOptions {
	legal?: {
		type: ActivityName
	},
	illegal?: {
		type: ActivityName
	}
}
