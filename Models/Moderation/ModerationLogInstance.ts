import {ObjectId} from "mongodb";
import User from "../User/User";
import {IModerationLog, IModerationMuteLog, ModerationType} from "./ModerationLog";

export class ModerationLogInstance implements IModerationLog {
	public _id: ObjectId;
	public type: ModerationType;
	public mute?: IModerationMuteLog;
	public userId: ObjectId;
	public actionedById: ObjectId;
	public createdAt: Date;
	public updatedAt: Date;

	private _user: User;
	private _actionedBy: User;

	constructor(moderationLog: IModerationLog) {
		Object.assign(this, moderationLog);
	}

}
