import {Log} from "@envuso/common";
import {Message, MessageType, TextChannel} from "discord.js";
import {ObjectId} from "mongodb";
import Model from "../Core/Database/Mongo/Model";
import {id} from "../Core/Database/ModelDecorators";


export default class SentMessage extends Model<SentMessage> {

	@id
	_id: ObjectId;

	authorId: string;
	authorUsername: string;

	channelId: string;
	channelName: string;

	content: string;

	type: MessageType;

	createdAt: Date;

	public static async storeInfo(message: Message) {
		return SentMessage.create<SentMessage>({
			authorId       : message.author.id.toString(),
			authorUsername : message.author.username,
			channelId      : message.channel.id,
			channelName    : (message.channel as TextChannel).name,
			content        : message.content,
			type           : message.type,
			createdAt      : message.createdAt,
		});
	}

}

