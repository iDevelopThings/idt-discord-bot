import {Log} from "@envuso/common";
import {MessageEmbed} from "discord.js";
import {ObjectId} from "mongodb";
import {id} from "../../Core/Database/ModelDecorators";
import Model from "../../Core/Database/Mongo/Model";
import {getChannel} from "../../Util/Bot";
import {formatDate} from "../../Util/Formatter";
import User from "../User/User";

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

export class ModerationLog extends Model<ModerationLog> {

	@id
	public _id: ObjectId;
	public type: ModerationType;
	public mute?: IModerationMuteLog;
	@id
	public userId: ObjectId;
	@id
	public actionedById: ObjectId;
	public processedAt?: Date;
	public createdAt: Date;
	public updatedAt: Date;

	private _user: User;
	private _actionedBy: User;


	public async user() {
		if (!this.userId) {
			return null;
		}

		if (!this._user) {
			this._user = await User.find(this.userId) as User;
		}

		return this._user;
	}

	public async actionedBy() {
		if (!this.actionedById) {
			return null;
		}

		if (!this._actionedBy) {
			this._actionedBy = await User.find(this.actionedById) as User;
		}

		return this._actionedBy;
	}

	public markAsProcessed() {
		return this.queryBuilder().where({_id : this._id}).update(
			{$set : {processedAt : new Date()}}
		);
	}

	public async postToChannel() {
		const actionedBy = await this.actionedBy();
		const user       = await this.user();

		const embed = new MessageEmbed()
			.setColor('GREEN')
			.setAuthor(user.embedAuthorInfo)
			.addField('User', user.username)
			.addField('Actioned By', actionedBy.username);

		switch (this.type) {
			case ModerationType.MUTE:
				embed.setTitle('User Muted')
					.setDescription(this.mute.reason)
					.addField('Duration', `${this.mute.minutes} minute(s)`)
					.addField('Started At', formatDate(this.mute.startAt), true)
					.addField('End At', formatDate(this.mute.endAt), true);
				break;
			default:
				Log.error(`\`ModerationLogInstance.postToChannel\` is not handling log type \`${this.type}\`!`);
				return;
		}

		return getChannel('mod-logs').send({embeds : [embed]});
	}


	//	static collection() {
	//		return collection<IModerationLog>('moderation_logs');
	//	}

	//	static async find(filter: any): Promise<ModerationLogInstance[]> {
	//		const cursor  = this.collection().find(filter);
	//		const records = [];
	//
	//		while (await cursor.hasNext()) {
	//			const record = await cursor.next();
	//
	//			records.push(new ModerationLogInstance(record));
	//		}
	//
	//		return records;
	//	}

	//	static async findOne(filter: any): Promise<ModerationLogInstance> {
	//		const record = await this.collection().findOne(filter);
	//
	//		if (!record) {
	//			return null;
	//		}
	//
	//		return new ModerationLogInstance(record);
	//	}

	//	static async create(data: IModerationLog) {
	//		data.createdAt = new Date();
	//		data.updatedAt = new Date();
	//
	//		const {insertedId} = await this.collection().insertOne(data);
	//		const record       = await this.collection().findOne({_id : insertedId});
	//
	//		return new ModerationLogInstance(record);
	//	}

	//	static async update(filter: FilterQuery<IModerationLog>, values: UpdateQuery<IModerationLog> | Partial<IModerationLog>) {
	//		delete (values as any).updatedAt;
	//		delete (values as any).createdAt;
	//
	//		values = {
	//			$set         : values,
	//			$currentDate : {
	//				updatedAt : true
	//			}
	//		};
	//
	//		await this.collection().updateOne(
	//			filter,
	//			values
	//		);
	//
	//		return this.findOne(filter);
	//	}
}

export default ModerationLog;
