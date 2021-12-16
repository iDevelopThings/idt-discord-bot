import {Log} from "@envuso/common";
import {createCanvas, loadImage, CanvasRenderingContext2D} from 'canvas';
import {MessageAttachment} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import DiscordJsManager from "../../Core/Discord/DiscordJsManager";
import User from "../../Models/User/User";
import {getChannel, getChannelById, guildId, isOneOfChannels} from "../../Util/Bot";
import {formatMoney, formatXp} from "../../Util/Formatter";


export default class Leaderboard extends SlashCommand {
	private _dimensions: { width: number; height: number };

	constructor(creator) {
		super(creator, {
			deferEphemeral : false,
			guildIDs       : guildId,
			name           : 'leaderboard',
			description    : 'View the leaderboards',
			options        : [
				{
					name        : 'balance',
					description : 'View the balance leaderboard',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'invested',
					description : 'View the invested leaderboard',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'chatting',
					description : 'View the chatting skill leaderboard',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'gambling',
					description : 'View the gambling skill leaderboard',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'hacking',
					description : 'View the hacking skill leaderboard',
					type        : CommandOptionType.SUB_COMMAND,
				},
				{
					name        : 'investing',
					description : 'View the investing skill leaderboard',
					type        : CommandOptionType.SUB_COMMAND,
				},
				//				{
				//					name        : 'type',
				//					description : 'Chose between balance or invested leaderboards',
				//					required    : true,
				//					type        : CommandOptionType.STRING,
				//					choices     : [
				//						{name : 'Balance', value : 'balance'},
				//						{name : 'Invested', value : 'invested'},
				//					]
				//				}
			]
		});
		this.filePath = __filename;

		this._dimensions = {width : 500, height : 500};

	}


	async run(ctx: CommandContext) {

		if (!isOneOfChannels(ctx.channelID, 'activities', 'commands', 'gambling')) {
			return `You can only use /leaderboard commands in the activities, gambling or commands channel.`;
		}

		const leaderboardType = ctx.subcommands[0];

		const typeTitle = leaderboardType.slice(0, 1).toUpperCase() + leaderboardType.slice(1);

		try {

			const canvas  = createCanvas(this._dimensions.width, this._dimensions.height);
			const context = canvas.getContext("2d");

			context.font      = '900 32px sans-serif';
			context.fillStyle = '#ffffff';
			context.textAlign = 'center';
			context.fillText(typeTitle + ' Leaderboard', canvas.width / 2, 60);

			await this.drawBalances(ctx, context);

			const channel = getChannelById(ctx.channelID);
			await channel.send('', new MessageAttachment(canvas.toBuffer(), 'leaderboard.jpeg'));

			await ctx.defer(false);
			await ctx.delete();
		} catch (error) {
			Log.error(error.toString());
			console.trace(error);
		}
	}


	async drawBalances(ctx: CommandContext, context: CanvasRenderingContext2D) {
		let yPosition = 100;

		const users = await this.getLeaderboardUsers(ctx);

		for (let usersKey in users) {
			const user: User = users[usersKey];

			const username             = `${user.displayName}`;
			context.font               = '400 25px sans-serif';
			const measurementsUsername = context.measureText(username);

			const leaderboardValue = this.getLeaderboardValueForUser(ctx, user);

			context.font            = '700 22px sans-serif';
			const valueMeasurements = context.measureText(leaderboardValue);

			const userCanvas  = createCanvas(measurementsUsername.width + valueMeasurements.width + 10 + 20 + 50, 50);
			const userContext = userCanvas.getContext("2d");

			userContext.save();
			this.roundedBox(0, 0, userCanvas.width, userCanvas.height, 8, userContext);
			userContext.clip();

			userContext.fillStyle = 'rgb(255,255,255)';
			userContext.fillRect(0, 0, userCanvas.width, userCanvas.height);

			userContext.font         = '400 25px sans-serif';
			userContext.fillStyle    = '#404040';
			userContext.textAlign    = 'left';
			userContext.textBaseline = 'top';
			userContext.fillText(username, 50, 15);

			userContext.beginPath();
			userContext.arc(10 + 15, 10 + 15, 15, 0, Math.PI * 2, true);
			userContext.closePath();
			userContext.clip();

			const avatar = await loadImage(
				user.avatar === null
					? DiscordJsManager.client().user.avatarURL({format : "png"})
					: user.avatar
			);
			userContext.drawImage(avatar, 10, 10, 30, 30);
			userContext.restore();

			userContext.save();
			this.roundedBox(measurementsUsername.width + 60, 0, valueMeasurements.width + 20, userCanvas.height, 8, userContext);
			userContext.clip();

			userContext.fillStyle = 'rgb(3,154,255)';
			userContext.fillRect(measurementsUsername.width + 60, 0, valueMeasurements.width + 20, userCanvas.height);

			userContext.font         = '700 22px sans-serif';
			userContext.fillStyle    = '#ffffff';
			userContext.textAlign    = 'left';
			userContext.textBaseline = 'top';
			userContext.fillText(leaderboardValue, measurementsUsername.width + 70, 15);

			context.drawImage(userCanvas, (this._dimensions.width / 2) - (userCanvas.width / 2), yPosition);

			yPosition += 65;
		}

	}

	getLeaderboardUsers(ctx: CommandContext) {
		return User.getCollection<User>().find({
			isBot : false,
		}, {
			collation : {numericOrdering : true, locale : "en_US"},
			sort      : this.getLeaderboardSort(ctx),
			limit     : 6
		}).toArray();
	}

	getLeaderboardSort(ctx: CommandContext) {
		switch (ctx.subcommands[0]) {
			case "balance":
			case "invested":
				return {[`balances.${ctx.subcommands[0]}`] : -1};
			default :
				return {[`skills.${ctx.subcommands[0]}.xp`] : -1};
		}
	}

	getLeaderboardValueForUser(ctx: CommandContext, user: User) {
		switch (ctx.subcommands[0]) {
			case "balance":
			case "invested":
				return formatMoney(user.balances[ctx.subcommands[0]]);
			default :
				return formatXp(user.skills[ctx.subcommands[0]].xp) + ' xp';
		}
	}

	private roundedBox(x, y, width, height, radius, contextToUse) {
		contextToUse.beginPath();
		contextToUse.moveTo(x + radius, y);
		contextToUse.lineTo(x + width - radius, y);
		contextToUse.quadraticCurveTo(x + width, y, x + width, y + radius);
		contextToUse.lineTo(x + width, y + height - radius);
		contextToUse.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
		contextToUse.lineTo(x + radius, y + height);
		contextToUse.quadraticCurveTo(x, y + height, x, y + height - radius);
		contextToUse.lineTo(x, y + radius);
		contextToUse.quadraticCurveTo(x, y, x + radius, y);
		contextToUse.closePath();
	}
}

