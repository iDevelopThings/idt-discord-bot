import {Type} from "class-transformer";
import {ColorResolvable} from "discord.js";
import {ItemWithWeight} from "../ItemWithWeight";
import {MysteryBoxItem, MysteryBoxRarity} from "../MysteryBoxItem";
import {Money} from "./Money";

export class CommonMysteryBox extends MysteryBoxItem {
	public name: string             = 'Common Mystery Box';
	public id: string               = 'common.mystery.box';
	public color: ColorResolvable   = 'GREY';
	public rarity: MysteryBoxRarity = MysteryBoxRarity.COMMON;
	public weight: number           = 100;


	@Type(() => ItemWithWeight)
	public items: ItemWithWeight[] = [
		ItemWithWeight.create(new Money(1_000_000), 100),
		ItemWithWeight.create(new Money(10_000_000), 50),
		ItemWithWeight.create(new Money(100_000_000), 30),
		ItemWithWeight.create(new Money(1_000_000_000_000), 1),
	];

}
