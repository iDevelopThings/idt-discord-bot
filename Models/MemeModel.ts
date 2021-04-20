import {MemeResult} from "../Handlers/Meme";
import {collection} from "./ModelHelper";


export default class MemeModel {

	static collection() {
		return collection<MemeResult>('memes');
	}

	static async exists(url: string): Promise<boolean> {
		const meme = await this.collection().findOne({url});
		console.log(!!meme);
		return !!meme;
	}

	static async store(meme: MemeResult) {
		const createdUser = await this.collection().insertOne(meme.forInsert());

		return this.collection().findOne({_id : createdUser.insertedId});
	}

}

