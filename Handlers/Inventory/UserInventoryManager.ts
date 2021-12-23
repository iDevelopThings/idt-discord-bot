import {Buffer} from "buffer";
import Konva from "konva/cmj";
import User from "../../Models/User/User";
import {InventoryInterfaceRenderer} from "./InventoryInterfaceRenderer";
import {BaseInventoryItem} from "./Item/BaseInventoryItem";
import {ItemTransformer} from "./Item/ItemTransformer";
import {ItemIdentifiers, Items, ItemTypes} from "./Item/ItemTypes";

export default class UserInventoryManager {

	constructor(private user: User) {}

	public addItem(itemIdentifier: ItemIdentifiers, amount: number = 1) {
		const currentItemIdx = this.getItemIndex(itemIdentifier);

		if (currentItemIdx !== -1) {
			this.user.inventory[currentItemIdx].incrementAmount(amount);
			this.user.queuedBuilder().increment(`inventory.${currentItemIdx}._amount`, amount.toString());
			return;
		}

		const itemCtor = ItemTransformer.getItemCtor(itemIdentifier);

		const itemInst  = new itemCtor();
		itemInst.amount = amount;
		itemInst.slot   = this.getAvailableSlot(itemIdentifier);

		this.user.inventory.push(itemInst);
		this.user.queuedBuilder().push('inventory', itemInst);
	}

	public getItem<T extends ItemIdentifiers>(itemIdentifier: T): Items[T] {
		return this.user.inventory.find(i => i.id === itemIdentifier);
	}

	public getItemIndex<T extends ItemIdentifiers>(itemIdentifier: T): number {
		return this.user.inventory.findIndex(i => i.id === itemIdentifier);
	}

	public hasItem(itemIdentifier: ItemIdentifiers) {
		return this.getItem(itemIdentifier) !== undefined;
	}

	public getAvailableSlot<T extends ItemIdentifiers>(itemIdentifier: T) {
		let item = this.getItem(itemIdentifier);

		if (item) {
			return item.slot;
		}

		return this.user.inventory.length;
	}

	public hasItemAtSlot(inventorySlot: number) {
		return this.getItemAtSlot(inventorySlot) !== null;
	}

	public getItemAtSlot(inventorySlot: number): BaseInventoryItem | null {
		const item = this.user.inventory[inventorySlot];

		return item ?? null;
	}

	public getRenderedInventoryBuffer(): Promise<Buffer> {
		return InventoryInterfaceRenderer.drawAndGetBufferFor(this.user);
	}
}
