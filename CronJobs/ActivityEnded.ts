import {Log} from "@envuso/common";
import CronJob from "../Handlers/CronJob/CronJob";
import {ActivityName} from "../Models/User/Activities";
import User from "../Models/User/User";
import {illegalActivityChoices} from "../Commands/Activities/RunIllegalActivity";

export default class ActivityEnded extends CronJob {
	handlerId = 'activity-ended';
	runEvery  = '1m';

	public async run() {
		await super.run();

		const users = await User.get<User>(this.buildFilter());

		for (const user of users) {
			for (const activity of illegalActivityChoices) {
				const handler = user.activityManager().handlerForActivity(activity.value as ActivityName);
				const event   = handler.randomEventHit();

				if (!event?.name) {
					await handler.handleCompletion(user);

					continue;
				}

				Log.info(`Random event "${event.name}" for ${user.displayName}`);

				await handler.handleRandomEvent(user, event);
			}
		}
	}

	private buildFilter() {
		const filter = {};

		for (const activity of illegalActivityChoices) {
			filter[`activities.${activity.value}.endsAt`] = {
				$gt : new Date(),
			};
		}

		return filter;
	}
}
