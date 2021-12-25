import {ColorResolvable} from "discord.js";
import User from "../../../Models/User/User";
import {formatMoney} from "../../../Util/Formatter";
import {getChanceInstance} from "../../../Util/Random";
import {BaseInventoryItem} from "./BaseInventoryItem";
import {Money} from "./Items/Money";

export enum MysteryBoxRarity {
	COMMON = 'common',
	RARE   = 'rare',
	EPIC   = 'epic',
}

export class MysteryBoxItem extends BaseInventoryItem {
	public color: ColorResolvable;
	public rarity: MysteryBoxRarity;
	public weight: number = 0;

	public items: Array<[BaseInventoryItem, number]> = [
	];

	public async redeem(user: User, channelId: string, addToInventory: boolean = false) {

		if (addToInventory) {
			user.inventoryManager().add(this, this.amount);
			await user.executeQueued();

			await this.sendRedeemedMessage(user, channelId, `${this.amount}x ${this.name} was added to your inventory`);

			return;
		}

		const chance = getChanceInstance();

		const items   = [];
		const weights = [];
		this.items.forEach(([item, weight]) => {
			items.push(item);
			weights.push(weight);
		});

		const item = chance.weighted<Money>(items, weights);

		const message = (item instanceof Money)
			? `Your box contained ${item.amount}x ${item.name}`
			: `Your box contained ${formatMoney((item as any).amount)}`;

		await this.sendRedeemedMessage(user, channelId, message);

		await item.redeem(user, channelId, !(item instanceof Money));
	}
}
