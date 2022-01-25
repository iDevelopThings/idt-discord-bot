import {Type} from "class-transformer";
import {ColorResolvable} from "discord.js";
import {ItemWithWeight} from "../ItemWithWeight";
import {MysteryBoxItem, MysteryBoxRarity} from "../MysteryBoxItem";
import {Money} from "./Money";

export class EpicMysteryBox extends MysteryBoxItem {
	public name: string             = 'Epic Mystery Box';
	public id: string               = 'epic.mystery.box';
	public color: ColorResolvable   = 'PURPLE';
	public rarity: MysteryBoxRarity = MysteryBoxRarity.EPIC;
	public weight: number           = 1;


	@Type(() => ItemWithWeight)
	public items: ItemWithWeight[] = [
		// Item, weight of random, amount to give
		ItemWithWeight.create(new Money(1_000_000), 100),
		ItemWithWeight.create(new Money(10_000_000), 50),
		ItemWithWeight.create(new Money(100_000_000), 30),
		ItemWithWeight.create(new Money(1_000_000_000_000), 1),
	];
}
