import {Log} from "@envuso/common";
import {TextChannel, Util} from "discord.js";
import path from "path";
import readLastLines from 'read-last-lines';
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import SentMessage from "../../Models/SentMessage";
import User from "../../Models/User/User";
import {getChannelById, guild, guildId} from "../../Util/Bot";
import {mdMessage} from "../../Util/Message";
import NumberInput from "../../Util/NumberInput";
import {adminPermissionsForCommand, isAdmin} from "../../Util/Role";
import {getNewSpamInflictedXp, sendSpamLogs} from "../../Util/SpamShit";

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
				{
					name        : 'updatemessages',
					description : 'Update messages',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'daemonlogs',
					description : 'Output the last x lines of the daemon logs',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'lines',
							description : 'How many lines to read? defaults to 50',
							type        : CommandOptionType.INTEGER
						}
					]
				},
				{
					name        : 'spamlogs',
					description : 'Output spam logs for a specific user, or all',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'user',
							description : 'Output a users spam log',
							type        : CommandOptionType.USER,
						},
					]
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
			case 'spamlogs':
				return this.spamlogs(ctx);
			case 'daemonlogs':
				return this.daemonLogs(ctx);
			case 'updatemessages':
				return this.updateMessages(ctx);
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

	private async spamlogs(ctx: CommandContext) {

		const options = ctx.options as { spamlogs?: { user: string } };
		const channel = getChannelById(ctx.channelID);

		const users = [];

		if (options.spamlogs?.user) {
			users.push(await User.getOrCreate(options.spamlogs.user));
		}

		if (await sendSpamLogs(channel.name, users)) {
			return 'le boosh';
		}

		return 'Epic fail.';

	}

	private async daemonLogs(ctx: CommandContext) {

		const options = ctx.options as { daemonlogs?: { lines: number } };

		if (!options?.daemonlogs?.lines) {
			options.daemonlogs.lines = 50;
		}

		if (options.daemonlogs.lines >= 100) {
			options.daemonlogs.lines = 100;
		}
		await ctx.send('Getting them now ☑️');

		const logPath = path.resolve('/home', 'forge', '.forge', 'daemon-637095.log');

		const logsData = await readLastLines.read(logPath, options.daemonlogs.lines, 'utf-8');

		const logChunks = Util.splitMessage(logsData, {
			char      : ' ',
			maxLength : 1500,
		});

		for (let log of logChunks) {
			getChannelById(ctx.channelID).send(mdMessage(log));
		}

	}


	private async updateMessages(ctx: CommandContext) {

		for (let channel of guild().channels.cache.values()) {
			if (!channel.isText()) {
				continue;
			}

			const textChannel = (channel as TextChannel);
			if (!guild().roles.everyone.permissionsIn(textChannel).has('SEND_MESSAGES')) {
				continue;
			}

			Log.info('---------');
			Log.info('Getting messages for channel: ' + textChannel.name);

			let lastId = null;
			for (let i = 0; i < 3; i++) {
				Log.info('Messages page ' + i);

				const messages = await textChannel.messages.fetch({
					limit  : 100,
					before : lastId ? lastId : undefined,
				});

				if (i === 0 && !messages.size) {
					Log.info('No messages in channel ' + channel.name);
					break;
				}

				if (!messages || !messages?.size) {
					Log.info('No more messages for page ' + i);
					break;
				}

				const last = messages.last();

				if (last) {
					lastId = last.id;
				} else {
					debugger;
				}

				let mi = 0;
				for (let [id, message] of messages) {
					try {
						const user = await User.getOrCreate(message.author.id);

						const [xp, calcs] = await getNewSpamInflictedXp(30, user);

						user.queuedBuilder().set({spamInfo : calcs});
						await user.executeQueued();

						SentMessage.storeInfo(message).catch(error => Log.error(error));
						mi++;

						Log.info(`Processed message for user: ${user.username} - message ${mi}/${messages.size}`);
					} catch (error) {
						Log.error(error);
					}
				}

			}


		}

	}

}

export interface IBalanceOptions {
	user?: string;
	amount?: string;
}
