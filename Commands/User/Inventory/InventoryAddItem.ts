import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import {GamblingColor} from "../../../Handlers/Gambling/Gambling";
import {ItemTransformer} from "../../../Handlers/Inventory/Item/ItemTransformer";
import {ItemIdentifiers} from "../../../Handlers/Inventory/Item/ItemTypes";
import User from "../../../Models/User/User";
import {guildId} from "../../../Util/Bot";
import NumberInput from "../../../Util/NumberInput";
import {adminPermissionsForCommand, isAdmin} from "../../../Util/Role";

export default class InventoryAddItem extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs          : guildId,
			name              : 'inventory-add',
			description       : 'Add an item to your inventory',
			defaultPermission : false,
			permissions       : adminPermissionsForCommand(),
			options           : [
				{
					name        : 'item',
					description : 'The item to add',
					type        : CommandOptionType.STRING,
					choices     : ItemTransformer.itemClasses.map(c => {
						return {
							name  : c.instance.name,
							value : c.instance.id,
						};
					}),
					required    : true,
				},
				{
					name        : 'amount',
					description : 'The amount of the item to add',
					type        : CommandOptionType.STRING,
					required    : false,
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		if (!isAdmin(ctx.member)) {
			return "You cannot use this command";
		}

		await ctx.defer(false);

		const addOptions = ctx.options as {
			item: ItemIdentifiers,
			amount?: string
		};

		if (!ItemTransformer.isItem(addOptions.item)) {
			return `This isn't a valid item id.`;
		}

		const user        = await User.getOrCreate(ctx.user.id);
		const amountInput = new NumberInput((addOptions.amount || '1'), user).parse(false);

		if (!amountInput.isValid()) {
			return amountInput.error();
		}

		const item = ItemTransformer.getItemInstance(addOptions.item);

		if (!item) {
			return `This isn't a valid item id.`;
		}


		user.inventoryManager().addItem(addOptions.item, amountInput.numberValue());
		await user.executeQueued();

		return `Added ${amountInput.value()} ${item.name} to your inventory.`;
	}
}
