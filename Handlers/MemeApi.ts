import axios from "axios";

export class MemeResult {

	public postLink?: string;
	public subreddit?: string;
	public title?: string;
	public url?: string;
	public nsfw?: boolean;
	public spoiler?: boolean;
	public author?: string;
	public ups?: number;
	public preview?: string[];

	constructor(data: any) {
		Object.assign(this, data);
	}

	isNsfw() {
		return this.nsfw === true;
	}

	public async regenerate() {
		const meme = await MemeApi.getMeme();

		Object.assign(this, meme);
	}

	forInsert() {
		return Object.assign({}, this);
	}
}

export default class MemeApi {

	static async getMeme(allowNsfw: boolean = false): Promise<MemeResult> {
		const response = await axios.get('https://meme-api.herokuapp.com/gimme');

		return new MemeResult(response?.data);
	}

}
