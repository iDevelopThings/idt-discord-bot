import ModerationLog, {ModerationType} from "../../Models/Moderation/ModerationLog";
import CronJob from "../../Handlers/CronJob/CronJob";

export default class UnMuter extends CronJob {
	handlerId = 'moderation/un-muter';
	runEvery  = '1m';

	public async run() {
		await super.run();

		const now   = new Date();
		// Get all mutes that expired in the last minute
		const mutes = await ModerationLog.where<ModerationLog>({
			type        : ModerationType.MUTE,
			processedAt : null, // Not already processed
			$or         : [
				{ // Will end in the next 1 minute
					$and : [
						{
							'mute.endAt' : {
								$gte : new Date(Date.now() - 1000)
							},
						},
						{
							'mute.endAt' : {
								$lte : new Date(Date.now() + (60 * 1000))
							}
						}
					]
				},
				{ // or, has already ended
					'mute.endAt' : {
						$lt : now
					}
				}
			]
		}).get();

		for (const mute of mutes) {
			// It's already ended so process it now
			if (mute.mute.endAt <= now) {
				await this.handleUnmute(mute);
			} else {
				// It's going to end in the next minute so "queue" it up
				setTimeout(() => this.handleUnmute(mute), mute.mute.endAt.getTime() - Date.now());
			}

			// Mark as processed now so it doesn't get double processed
			await mute.markAsProcessed();
		}
	}

	/*
	 Private Functions
	 */

	private async handleUnmute(mute: ModerationLog) {
		// Only unmute the user if they don't have overlapping mutes active
		if (await this.hasMuteActiveAfter(mute)) {
			return;
		}

		const user = await mute.user();

		await user.moderationManager().unmute();
	}

	private async hasMuteActiveAfter(mute: ModerationLog) {
		return !!await ModerationLog.findOne({
			_id          : {
				$ne : mute._id
			},
			userId       : mute.userId,
			'mute.endAt' : {
				$gte : mute.mute.endAt
			},
			processedAt  : null
		});
	}
}
