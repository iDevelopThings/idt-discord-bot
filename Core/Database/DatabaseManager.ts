import {MongoClient} from "mongodb";
import pluralize from "pluralize";
import {container} from "tsyringe";
import Configuration from "../../Configuration";
import CronJobInformation from "../../Models/CronJobInformation";
import Meme from "../../Models/Meme";
import ModerationLog from "../../Models/Moderation/ModerationLog";
import User from "../../Models/User/User";

export default class DatabaseManager {

	public async boot() {
		const client     = new MongoClient(Configuration.mongo.url, Configuration.mongo.clientOptions);
		const connection = await client.connect();

		container.register(MongoClient, {useValue : connection});

		await this.loadModels();
	}

	public models() {
		return [
			User,
			Meme,
			CronJobInformation,
			ModerationLog
		];
	}

	async loadModels() {

		const client = container.resolve(MongoClient);

		for (let model of this.models()) {
			const collection = client.db(Configuration.mongo.name).collection<typeof model>(
				pluralize(model.name.toLowerCase())
			);
			container.register(model.name + 'Model', {useValue : collection});
		}

	}
}
