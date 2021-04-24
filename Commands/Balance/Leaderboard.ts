import {Log} from "@envuso/common";
import {createCanvas, loadImage} from 'canvas';
import {MessageAttachment, TextChannel} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import DiscordJsManager from "../../Core/Discord/DiscordJsManager";
import User from "../../Models/User/User";
import {getChannel, guild, guildId} from "../../Util/Bot";
import {formatMoney} from "../../Util/Formatter";


export default class Leaderboard extends SlashCommand {

	constructor(creator) {
		super(creator, {
			deferEphemeral : false,
			guildIDs       : guildId,
			name           : 'leaderboard',
			description    : 'Get balance/investment leaderboard',
			options        : [
				{
					name        : 'type',
					description : 'Chose between balance or invested leaderboards',
					required    : true,
					type        : CommandOptionType.STRING,
					choices     : [
						{name : 'Balance', value : 'balance'},
						{name : 'Invested', value : 'invested'},
					]
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const gambleChannel = getChannel('gambling');

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /leaderboard commands in the ${gambleChannel.toString()} channel.`;
		}


		const type      = ctx.options.type as string;
		const typeTitle = type.slice(0, 1).toUpperCase() + type.slice(1);

		try {
			await ctx.send('Getting you the ' + typeTitle + ' leaderboard now...');

			const dimensions = {width : 500, height : 500};

			const canvas = createCanvas(dimensions.width, dimensions.height);

			const context = canvas.getContext("2d");

			const roundedBox = (x, y, width, height, radius, contextToUse) => {
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
			};

			context.font      = '900 32px sans-serif';
			context.fillStyle = '#ffffff';
			context.textAlign = 'center';
			context.fillText(typeTitle + ' Leaderboard', canvas.width / 2, 60);

			let sortBy = null;
			switch (type) {
				case "balance":
					sortBy = {'balances.balance' : -1};
					break;
				case "invested":
					sortBy = {'balances.invested' : -1};
					break;
			}


			const users = await User.getCollection<User>().find({
				username : {$not : {$eq : 'iDevelopBot'}}
			}, {
				collation : {numericOrdering : true, locale : "en_US"},
				sort      : sortBy,
				limit     : 6
			}).toArray();

			let balanceY = 100;

			const drawBalances = async (avatars = false) => {

				for (let usersKey in users) {
					const user: User = users[usersKey];

					const username             = `${user.displayName}`;
					context.font               = '400 25px sans-serif';
					const measurementsUsername = context.measureText(username);

					const balance             = formatMoney(user.balances[type]);
					context.font              = '700 22px sans-serif';
					const measurementsBalance = context.measureText(balance);


					const userCanvas  = createCanvas(measurementsUsername.width + measurementsBalance.width + 10 + 20 + 50, 50);
					const userContext = userCanvas.getContext("2d");


					userContext.save();
					roundedBox(0, 0, userCanvas.width, userCanvas.height, 8, userContext);
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
					roundedBox(measurementsUsername.width + 60, 0, measurementsBalance.width + 20, userCanvas.height, 8, userContext);
					userContext.clip();

					userContext.fillStyle = 'rgb(3,154,255)';
					userContext.fillRect(measurementsUsername.width + 60, 0, measurementsBalance.width + 20, userCanvas.height);

					userContext.font         = '700 22px sans-serif';
					userContext.fillStyle    = '#ffffff';
					userContext.textAlign    = 'left';
					userContext.textBaseline = 'top';
					userContext.fillText(balance, measurementsUsername.width + 70, 15);

					context.drawImage(userCanvas, (dimensions.width / 2) - (userCanvas.width / 2), balanceY);

					balanceY += 65;
				}

			};

			await drawBalances();

			const channel = guild().channels.resolve(ctx.channelID) as TextChannel;


			await channel.send('', new MessageAttachment(canvas.toBuffer(), 'leaderboard.jpeg'));
		} catch (error) {
			Log.error(error.toString());
			console.trace(error);
		}
	}


}
