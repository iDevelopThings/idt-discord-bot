import {CommandOptionType, SlashCommand} from "slash-create";
import {CommandContext} from "slash-create";
import {MysteryBox} from "../../Handlers/MysteryBox";
import User from "../../Models/User/User";
import {guildId} from "../../Util/Bot";
import {adminPermissionsForCommand} from "../../Util/Role";

export default class GiveMysteryBoxCommand extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs          : guildId,
			name              : 'givebox',
			description       : 'Give a mysterybox to a user',
			defaultPermission : false,
			permissions       : adminPermissionsForCommand(),
			options           : [
				{
					name        : 'user',
					description : 'The user to give the box to',
					type        : CommandOptionType.USER,
					required    : false,
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const user = await User.getOrCreate(ctx?.options?.user ?? ctx.user.id);

		const [can, box] = MysteryBox.canReceive(user);

		if (!can) {
			return 'Box not given, didn\'t get lucky enough.';
		}

		await MysteryBox.give(user, box);
		await MysteryBox.sendEmbedViaContext(user, ctx, new box());


	}
}
