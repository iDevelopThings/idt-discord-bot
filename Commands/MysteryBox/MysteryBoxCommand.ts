import {CommandContext, CommandOptionType, SlashCommand} from "slash-create";
import {ItemIdentifiers} from "../../Handlers/Inventory/Item/ItemTypes";
import {Item} from "../../Handlers/Inventory/Item/Manager/Item";
import {MysteryBox} from "../../Handlers/MysteryBox";
import User from "../../Models/User/User";
import {guildId} from "../../Util/Bot";

export default class MysteryBoxCommand extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs    : guildId,
			name        : 'box',
			description : 'MysteryBox',
			options     : [
				{
					name        : 'open',
					description : 'Open a mysterybox',
					type        : CommandOptionType.SUB_COMMAND,
					options     : [
						{
							name        : 'box',
							description : 'The box to give',
							type        : CommandOptionType.STRING,
							choices     : Item.itemClasses
								.filter(i => MysteryBox.boxIds().includes(i.instance.id))
								.map(c => {
									return {
										name  : c.instance.name,
										value : c.instance.id,
									};
								}),
						}
					]
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		switch (ctx.subcommands[0]) {
			case 'open':
				return this.handleBoxOpen(ctx);
		}
	}

	private async handleBoxOpen(ctx: CommandContext) {
		const options = ctx.options.open as { box: ItemIdentifiers };
		const item    = Item.get(options.box);

		const user = await User.getOrCreate(ctx.user.id);

		if (!user.inventoryManager().hasItem(options.box)) {
			return `You don't have any ${item.name} in your inventory.`;
		}

		const invItem = user.inventoryManager().getItem(options.box);
		await invItem.redeem(user, ctx.channelID);

		await user.inventoryManager().remove(options.box, 1);
		await ctx.delete();
	}
}
