import {SlashCommand} from "slash-create";
import {CommandContext} from "slash-create";
import User from "../../../Models/User/User";
import {guildId} from "../../../Util/Bot";

export default class Inventory extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs    : guildId,
			name        : 'inventory',
			description : 'View your inventory',
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		await ctx.defer(false);

		const user = await User.getOrCreate(ctx.user.id);

		await ctx.send({
			content : 'Here\'s your inventory:',
			file    : {
				file : await user.inventoryManager().getRenderedInventoryBuffer(),
				name : 'inventory-' + new Date().getTime() + '.png'
			}
		});
	}
}
