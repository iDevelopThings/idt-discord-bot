import {Type} from "class-transformer";
import {ColorResolvable} from "discord.js";
import {ItemWithWeight} from "../ItemWithWeight";
import {MysteryBoxItem, MysteryBoxRarity} from "../MysteryBoxItem";
import {Money} from "./Money";

export class RareMysteryBox extends MysteryBoxItem {
	public name: string             = 'Rare Mystery Box';
	public id: string               = 'rare.mystery.box';
	public color: ColorResolvable   = 'BLUE';
	public rarity: MysteryBoxRarity = MysteryBoxRarity.RARE;
	public weight: number           = 10;

	@Type(() => ItemWithWeight)
	public items: ItemWithWeight[] = [
		// Item, weight of random, amount to give
		ItemWithWeight.create(new Money(1_000_000), 100),
		ItemWithWeight.create(new Money(10_000_000), 50),
		ItemWithWeight.create(new Money(100_000_000), 30),
		ItemWithWeight.create(new Money(1_000_000_000_000), 1),
	];

}
