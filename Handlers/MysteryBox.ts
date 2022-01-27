import {MessageEmbed, TextChannel} from "discord.js";
import {CommandContext} from "slash-create";
import User from "../Models/User/User";
import {guild} from "../Util/Bot";
import {getChanceInstance} from "../Util/Random";
import {Item} from "./Inventory/Item/Manager/Item";
import {MysteryBoxItem} from "./Inventory/Item/MysteryBoxItem";

export class MysteryBox {

	public static boxIds() {
		return ["common.mystery.box", "epic.mystery.box", "rare.mystery.box"];
	}
	private static getWeightedLists() {
		const boxes   = [];
		const weights = [];

		for (let id of this.boxIds()) {
			boxes.push(Item.getConstructor(id));
			weights.push(Item.get(id).weight);
		}

		return [boxes, weights];
	}

	static canReceive(user: User): [boolean, typeof MysteryBoxItem] {
		const chance = getChanceInstance();

		if (!chance.bool({likelihood : 2})) {
			return [false, null];
		}

		const [boxes, weights] = this.getWeightedLists();

		return [true, chance.weighted(boxes, weights)];
	}

	public static async give(user: User, boxCtor: typeof MysteryBoxItem) {
		const box = new boxCtor();

		user.inventoryManager().add(box);
		await user.executeQueued();
	}

	private static embed(user: User, box: MysteryBoxItem) {
		return new MessageEmbed()
			.setColor(box.color)
			.setAuthor(user.embedAuthorInfo)
			.setTitle(`A random ${box.name} appears`)
			.setThumbnail(box.getImageUrl())
			.setDescription("You can open it via the /open command. Or see it in your inventory via /inventory.");
	}

	public static async sendEmbed(user: User, channelId: string, box: MysteryBoxItem) {
		const channel = guild().channels.cache.get(channelId) as TextChannel;
		await channel.send({embeds : [this.embed(user, box)]});
	}

	public static async sendEmbedViaContext(user: User, ctx: CommandContext, box: MysteryBoxItem) {
		return ctx.send({embeds : [this.embed(user, box).toJSON()]});
	}
}
