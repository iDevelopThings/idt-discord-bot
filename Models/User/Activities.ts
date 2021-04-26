import IllegalActivity from "../../Handlers/Activities/IllegalActivity";
import RaidLocalCannabisFarm from "../../Handlers/Activities/RaidLocalCannabisFarm";
import {dayjs} from "../../Util/Date";
import User from "./User";

export type ActivityName = "raid_local_cannabis";

export interface IActivities {
	name: ActivityName;
	endsAt: Date;
}

export default class Activities {

	constructor(private user: User) {}

	hasActivity(name: ActivityName) {
		return !!this.user.activities[name];
	}

	get(name: ActivityName): IActivities {
		return this.user.activities[name];
	}

	hasEnded(name: ActivityName) {
		if (!this.hasActivity(name)) {
			return true;
		}

		return dayjs().isAfter(this.get(name).endsAt);
	}

	timeRemaining(name : ActivityName){
		if(!this.hasActivity(name))
			return null;

		return dayjs(this.get(name).endsAt).fromNow(true);
	}

	public setStarted(name: ActivityName, activityHandler: IllegalActivity) {
		this.user.queuedBuilder()
			.set({
				[`activities.${name}`] : {
					name   : name,
					endsAt : dayjs().add(activityHandler.runsFor()).toDate()
				}
			});

		return this.user;
	}

	public handlerForActivity(name: ActivityName) {
		switch (name) {
			case 'raid_local_cannabis':
				return new RaidLocalCannabisFarm(this.get(name));
			default:
				return undefined;
		}
	}

	public removeActivity(activity: ActivityName) {
		this.user.queuedBuilder().unset(`activities.${activity}`);
	}
}
