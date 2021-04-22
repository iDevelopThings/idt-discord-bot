import {FilterQuery, ObjectId, UpdateQuery} from "mongodb";
import {collection} from "../ModelHelper";
import Moderation from "./Moderation";
import {ModerationLogInstance} from "./ModerationLogInstance";

export enum ModerationType {
	MUTE = 'mute'
}

export interface IModerationLog {
	_id?: ObjectId;
	type: ModerationType;
	mute?: IModerationMuteLog;
	userId: ObjectId;
	actionedById: ObjectId;
	processedAt?: Date;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface IModerationMuteLog {
	minutes: number;
	reason: string;
	startAt: Date;
	endAt: Date;
}

export class ModerationLog {
	static collection() {
		return collection<IModerationLog>('moderation_logs');
	}

	static async find(filter: any): Promise<ModerationLogInstance[]> {
		const cursor  = this.collection().find(filter);
		const records = [];

		while (await cursor.hasNext()) {
			const record = await cursor.next();

			records.push(new ModerationLogInstance(record));
		}

		return records;
	}

	static async findOne(filter: any): Promise<ModerationLogInstance> {
		const record = await this.collection().findOne(filter);

		if (!record) {
			return null;
		}

		return new ModerationLogInstance(record);
	}

	static async create(data: IModerationLog) {
		data.createdAt = new Date();
		data.updatedAt = new Date();

		const {insertedId} = await this.collection().insertOne(data);
		const record       = await this.collection().findOne({_id : insertedId});

		return new ModerationLogInstance(record);
	}

	static async update(filter: FilterQuery<IModerationLog>, values: UpdateQuery<IModerationLog> | Partial<IModerationLog>) {
		delete (values as any).updatedAt;
		delete (values as any).createdAt;

		values = {
			$set         : values,
			$currentDate : {
				updatedAt : true
			}
		};

		await this.collection().updateOne(
			filter,
			values
		);

		return this.findOne(filter);
	}
}

export default ModerationLog;
