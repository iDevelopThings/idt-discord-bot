import {Buffer} from "buffer";
import User from "../../Models/User/User";
import {InventoryInterfaceRenderer} from "./InventoryInterfaceRenderer";
import {BaseInventoryItem} from "./Item/BaseInventoryItem";
import {ItemIdentifiers, Items} from "./Item/ItemTypes";
import {Item} from "./Item/Manager/Item";

export default class UserInventoryManager {

	constructor(private user: User) {}

	public add(item: BaseInventoryItem, amount: number = 1) {
		return this.addItem(item.id as ItemIdentifiers, amount);
	}

	public incrementItemCount(itemIdentifier: ItemIdentifiers, amount: number = 1) {
		const currentItemIdx = this.getItemIndex(itemIdentifier);

		if (currentItemIdx === -1) {
			return false;
		}

		this.user.inventory[currentItemIdx].incrementAmount(amount);
		this.user.queuedBuilder().increment(`inventory.${currentItemIdx}._amount`, amount.toString());

		return true;
	}

	public decrementItemCount(itemIdentifier: ItemIdentifiers, amount: number = 1) {
		const currentItemIdx = this.getItemIndex(itemIdentifier);

		if (currentItemIdx === -1) {
			return false;
		}

		this.user.inventory[currentItemIdx].decrementAmount(amount);
		this.user.queuedBuilder().decrement(`inventory.${currentItemIdx}._amount`, amount.toString());

		return true;
	}

	public addItem(itemIdentifier: ItemIdentifiers, amount: number = 1) {

		if (this.incrementItemCount(itemIdentifier, amount)) {
			return;
		}

		const itemCtor = Item.getConstructor(itemIdentifier);

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

	public async remove(id: ItemIdentifiers, amount: number) {
		const itemIdx = this.getItemIndex(id);
		const item    = this.user.inventory[itemIdx];

		if (!item) {
			return;
		}

		if (item.amount === 1) {
			this.user.inventory.splice(itemIdx, 1);
			const response = await this.user.collection().updateOne(
				{_id: this.user._id},
				//@ts-ignore
				{$pull : {inventory : {id : item.id}}}
			);
			return;
		}

		this.decrementItemCount(id, amount);
		await this.user.executeQueued();
	}
}
