import {Exclude} from "class-transformer";
import {ColorResolvable, MessageEmbed, TextChannel} from "discord.js";
import {Decimal128} from "mongodb";
import path from "path";
import User from "../../../Models/User/User";
import {guild} from "../../../Util/Bot";
import {numbro} from "../../../Util/Formatter";
import {MysteryBoxRarity} from "./MysteryBoxItem";

export class BaseInventoryItem {

	public name: string = '';

	public id: string = '';

	private _amount: Decimal128 = Decimal128.fromString('0');

	public slot: number = 0;

	public color: ColorResolvable;
	public rarity: MysteryBoxRarity;
	public weight: number                            = 0;
	public items: Array<[BaseInventoryItem, number]> = [];

	constructor(amount: number = 0) {
		this.amount = amount;
	}

	itemImageName() {
		return this.id + '.png';
	}

	itemImagePath() {
		return path.join(process.cwd(), 'Assets', 'Items', this.itemImageName());
	}

	public getImageUrl() {
		return `https://storage.idt.dev/discordbot/${this.itemImageName()}`;
	}

	@Exclude()
	get amount(): number {
		return numbro(this._amount.toString()).value();
	}

	set amount(amount: number) {
		this._amount = Decimal128.fromString(amount.toString());
	}

	incrementAmount(amount: number = 1) {
		this.amount = (this.amount + amount);
		return this;
	}

	decrementAmount(amount: number = 1) {
		this.amount = (this.amount - amount);
		return this;
	}

	public async redeem(user: User, channelId: string, addToInventory: boolean = false) {
		return null;
	}

	async sendRedeemedMessage(user: User, channelId: string, content: string) {
		const embed = new MessageEmbed()
			.setColor((this as any).color ?? 'BLUE')
			.setAuthor(user.embedAuthorInfo)
			.setTitle(`Redeemed ${this.name}`)
			.setThumbnail(this.getImageUrl())
			.setDescription(content);

		const channel = guild().channels.cache.get(channelId) as TextChannel;
		await channel.send({embeds : [embed]});
	}
}
