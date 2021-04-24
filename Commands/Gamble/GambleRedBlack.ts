import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import {GamblingInstanceManager, GamblingInstanceType} from "../../Handlers/Gambling/GamblingInstanceManager";
import {Gambling, GamblingColor} from "../../Handlers/Gambling/Gambling";
import User from "../../Models/User/User";
import {getChannel, getGambleChannel, guildId} from "../../Util/Bot";
import { percentOf} from "../../Util/Formatter";

export default class GambleRedBlack extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs       : guildId,
			name           : 'gamble',
			deferEphemeral : true,
			description    : 'Bet against the color landing on red or black',

			options : [
				{
					name        : 'amount',
					description : 'Gamble against red/black with a predefined amount.',
					type        : CommandOptionType.SUB_COMMAND,
					default     : true,
					options     : [
						{
							name        : 'color',
							description : 'The color to bet against',
							type        : CommandOptionType.INTEGER,
							required    : true,
							choices     : [
								{
									name  : 'Red',
									value : GamblingColor.RED
								},
								{
									name  : 'Black',
									value : GamblingColor.BLACK
								}
							],
						},
						{
							name        : 'amount',
							description : 'The amount of money to bet',
							type        : CommandOptionType.STRING,
							required    : true
						}
					]
				},
				{
					name        : 'percent',
					description : 'Use short methods like all, half etc',
					type        : CommandOptionType.SUB_COMMAND,
					default     : false,
					options     : [
						{
							name        : 'color',
							description : 'The color to bet against',
							type        : CommandOptionType.INTEGER,
							required    : true,
							choices     : [
								{
									name  : 'Red',
									value : GamblingColor.RED
								},
								{
									name  : 'Black',
									value : GamblingColor.BLACK
								}
							],
						},
						{
							name        : 'amount',
							description : 'The amount of money to bet',
							type        : CommandOptionType.STRING,
							choices     : [
								{
									name  : '100%',
									value : '100%'
								},
								{
									name  : '50%',
									value : '50%'
								},
								{
									name  : '25%',
									value : '25%'
								},
								{
									name  : '10%',
									value : '10%'
								},
							],
							required    : true
						}
					]
				},
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const gambleChannel = getChannel('gambling');

		if (ctx.channelID !== gambleChannel?.id) {
			return `You can only use /gamble commands in the ${gambleChannel.toString()} channel.`;
		}

		const user = await User.getOrCreate(ctx.user.id);

		const isPercentGamble = !!ctx.options?.percent;
		const options: any    = ctx.options[isPercentGamble ? 'percent' : 'amount'];

		let color: GamblingColor = Number(options.color) as unknown as GamblingColor;
		let amount: string       = String(options.amount);

		if (isPercentGamble) {
			amount = percentOf(user.balances.balance, amount);
		}

		const gambling = GamblingInstanceManager.instance<Gambling>(
			GamblingInstanceType.RED_BLACK
		);
		gambling.setChannel(getGambleChannel());

		const {joined, message, updatedBet} = await gambling.placeBet(user, color, amount);

		if (!joined) {
			return message;
		}

		if (updatedBet) {
			return 'Bet updated.';
		}

		return 'Joined the bet.';
	}


}
