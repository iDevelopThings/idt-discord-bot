import {ObjectId} from "mongodb";
import Model from "../Core/Database/Mongo/Model";
import {id} from "../Core/Database/ModelDecorators";



export default class Meme extends Model<Meme> {

	@id
	_id: ObjectId;

	postLink?: string;

	url?: string;

	nsfw?: boolean;

	static async exists(postLink: string) {
		const find = await Meme.findOne<Meme>({postLink});

		return !!find;
	}

}

