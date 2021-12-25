import {ColorResolvable} from "discord.js";
import {BaseInventoryItem} from "../BaseInventoryItem";
import {MysteryBoxItem, MysteryBoxRarity} from "../MysteryBoxItem";
import {Money} from "./Money";

export class CommonMysteryBox extends MysteryBoxItem {
	public name: string             = 'Common Mystery Box';
	public id: string               = 'common.mystery.box';
	public color: ColorResolvable   = 'GREY';
	public rarity: MysteryBoxRarity = MysteryBoxRarity.COMMON;
	public weight: number           = 100;

	public items: Array<[BaseInventoryItem, number]> = [
		// Item, weight of random, amount to give
		[new Money(1_000_000), 100],
		[new Money(10_000_000), 50],
		[new Money(100_000_000), 30],
		[new Money(1_000_000_000_000), 1],
	];

}
