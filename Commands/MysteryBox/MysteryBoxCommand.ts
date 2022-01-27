import {Log} from "@envuso/common";
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
					required    : true,
					options     : [
						{
							name        : 'box',
							description : 'The box you want to open',
							type        : CommandOptionType.STRING,
							required    : true,
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
		Log.info(`Trying to open box: ${options.box}`);

		const item = Item.get(options.box);

		if (!item) {
			return `Welp, somethings fucked.`;
		}

		const user = await User.getOrCreate(ctx.user.id);

		if (!user.inventoryManager().hasItem(options.box)) {
			return `You don't have any ${item.name} in your inventory.`;
		}

		const invItem = user.inventoryManager().getItem(item.id as ItemIdentifiers);
		await invItem.redeem(user, ctx.channelID);

		await user.inventoryManager().remove(options.box, 1);
		await ctx.delete();
	}
}
