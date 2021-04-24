import {Log} from "@envuso/common";
import {MessageEmbed} from "discord.js";
import {ObjectId} from "mongodb";
import {getChannel} from "../../Util/Bot";
import {formatDate} from "../../Util/Formatter";
import User from "../User/User";
import ModerationLog, {IModerationLog, IModerationMuteLog, ModerationType} from "./ModerationLog";

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
