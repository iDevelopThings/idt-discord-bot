import {CommandOptionType, SlashCommand} from "slash-create";
import {CommandContext} from "slash-create";
import {ItemIdentifiers} from "../../../Handlers/Inventory/Item/ItemTypes";
import {Item} from "../../../Handlers/Inventory/Item/Manager/Item";
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
					choices     : Item.itemClasses.map(c => {
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
				},
				{
					name        : 'user',
					description : 'The user to give the item to',
					type        : CommandOptionType.USER,
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
			amount?: string,
			user?: string,
		};

		if (!Item.isItem(addOptions.item)) {
			return `This isn't a valid item id.`;
		}

		const user        = await User.getOrCreate(addOptions?.user ?? ctx.user.id);
		const amountInput = new NumberInput((addOptions.amount || '1'), user).parse(false);

		if (!amountInput.isValid()) {
			return amountInput.error();
		}

		const item = Item.get(addOptions.item);

		if (!item) {
			return `This isn't a valid item id.`;
		}


		user.inventoryManager().addItem(addOptions.item, amountInput.numberValue());
		await user.executeQueued();

		return `Added ${amountInput.value()} ${item.name} to your inventory.`;
	}
}
