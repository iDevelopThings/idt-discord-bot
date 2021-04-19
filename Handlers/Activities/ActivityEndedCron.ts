//import {Log} from "@envuso/common";
//import cron from 'node-cron';
//import {illegalActivityChoices} from "../../Commands/Activities/RunIllegalActivity";
//import {ActivityName} from "../../Models/User/Activities";
//import User from "../../Models/User/User";
//import {UserInstance} from "../../Models/User/UserInstance";
//
//
//let instance = null;
//
//export default class ActivityEndedCron {
//
//
//	constructor() {
//		cron.schedule('*/1 * * * * *', this._handle.bind(this));
//	}
//
//	static start() {
//		if (instance) return instance;
//
//		instance = new ActivityEndedCron();
//
//		return instance;
//	}
//
//	async _handle() {
//
//		Log.success('Running activity cron');
//
//		const filters = {};
//
//		illegalActivityChoices.forEach(a => {
//			filters[`activities.${a.value}.endsAt`] = {$gt : new Date()};
//		});
//
//		const tempUser = await User.collection().find({
//			$or : [filters]
//		}).toArray();
//
//		const users : UserInstance[] = tempUser.map(u => new UserInstance(u));
//
//		for (let user of users) {
//
//			for (let illegalActivityChoice of illegalActivityChoices) {
//				const handler = user.activityManager().handlerForActivity(illegalActivityChoice.value as ActivityName);
//
//				const event = handler.randomEventHit();
//
//				if(!event?.name){
//					continue;
//				}
//
//				await handler.handleRandomEvent(user, event);
//			}
//
//		}
//
//	}
//
//}
