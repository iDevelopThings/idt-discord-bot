import {Log} from "@envuso/common";
import {MessageEmbed} from "discord.js";
import {ObjectId} from "mongodb";
import {getChannel} from "../../Util/Bot";
import {formatDate} from "../../Util/Formatter";
import User from "../User/User";
import {UserInstance} from "../User/UserInstance";
import ModerationLog, {IModerationLog, IModerationMuteLog, ModerationType} from "./ModerationLog";

export class ModerationLogInstance implements IModerationLog {
	public _id: ObjectId;
	public type: ModerationType;
	public mute?: IModerationMuteLog;
	public userId: ObjectId;
	public actionedById: ObjectId;
	public createdAt: Date;
	public updatedAt: Date;

	private _user: UserInstance;
	private _actionedBy: UserInstance;

	constructor(moderationLog: IModerationLog) {
		Object.assign(this, moderationLog);
	}

	public async user() {
		if (!this.userId) {
			return null;
		}

		if (!this._user) {
			this._user = await User.findOne({_id : this.userId});
		}

		return this._user;
	}

	public async actionedBy() {
		if (!this.actionedById) {
			return null;
		}

		if (!this._actionedBy) {
			this._actionedBy = await User.findOne({_id : this.actionedById});
		}

		return this._actionedBy;
	}

	public markAsProcessed() {
		return ModerationLog.update(
			{_id : this._id},
			{processedAt : new Date()}
		);
	}

	public async postToChannel() {
		const actionedBy = await this.actionedBy();
		const user       = await this.user();
		const embed      = new MessageEmbed()
			.setColor('GREEN')
			.setAuthor(user.username, user.avatar)
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

		return getChannel('mod-log').send({embed});
	}
}
