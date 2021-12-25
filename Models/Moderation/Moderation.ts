import {Log} from "@envuso/common";
import {getGuildMember, guild} from "../../Util/Bot";
import {getRole} from "../../Util/Role";
import User from "../User/User";
import ModerationLog, {IModerationLog, IModerationMuteLog, ModerationType} from "./ModerationLog";

export default class Moderation {
	constructor(private user: User) {}

	public async mute(minutes: number, reason: string, actionedBy: string) {
		const member = getGuildMember(this.user.id);

		if (!member) {
			return 'Unable to find member';
		}

		await this.createLog(ModerationType.MUTE, actionedBy, {
			minutes,
			reason  : reason || 'N/A',
			startAt : new Date(),
			endAt   : new Date(Date.now() + (minutes * 60 * 1000))
		});

		await member.roles.add(getRole('muted').id);

		Log.info(`Muted ${this.user.username}:${this.user.discriminator}`);
	}

	public async unmute() {
		const member = getGuildMember(this.user.id);

		if (!member) {
			return 'Unable to find member';
		}

		await member.roles.remove(getRole('muted').id);

		// TODO: Does this need to updateMany?
		// Tis now update many good sir
		await ModerationLog
			.where<ModerationLog>({
				type        : ModerationType.MUTE,
				userId      : this.user._id,
				endAt       : {
					$gte : new Date()
				},
				processedAt : null
			})
			.update({
				$set : {processedAt : new Date()}
			});

		Log.info(`Unmuted ${this.user.username}:${this.user.discriminator}`);
	}

	/*
	 Private Functions
	 */

	private async createLog(type: ModerationType, actionedByDiscordId: string, data: IModerationMuteLog) {
		const actionedBy = await User.getOrCreate(actionedByDiscordId);

		const log = await ModerationLog.create<ModerationLog>({
			type,
			[type]       : data,
			userId       : this.user._id,
			actionedById : actionedBy._id
		} as IModerationLog);

		await log.postToChannel();

		return log;
	}
}
