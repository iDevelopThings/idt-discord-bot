import {Duration} from "dayjs/plugin/duration";
import _ from "lodash";
import User from "../Models/User/User";
import {getChannel} from "./Bot";
import {createDuration} from "./Date";

export function getSpamResult(dates: Date[]): { spamCounter: number, avg: number, hours: number, duration: Duration } {
	let spamCounter = 0;
	let diffs       = [];

	for (let i = 0; i < dates.length; i++) {
		const curr = dates[i].getTime();
		const next = (dates[i + 1] || new Date()).getTime();

		if ((next - curr) <= (1000 * 20)) {
			spamCounter++;
		}

		diffs.push(next - curr);
	}

	const spamSum = diffs.reduce((memo, diff) => (memo + diff), 0);
	const avg     = spamSum / diffs.length;
	const hours   = avg / 3600000;

	return {
		spamCounter,
		avg,
		hours,
		duration : createDuration(avg, 'milliseconds'),
	};
}

export type XpCalculations = {
	is?: boolean,
	counter: number,
	fastMessaging: boolean,
	lotsOfMessaging: boolean,
	xpReducer: number,
	durationAs: {
		s: number,
		h: number,
	}
}
type MessageBasedXpRateResult = {
	is: boolean,
	rate: number,
	calcs?: XpCalculations;
};

export function getMessageBasedXpRate(dates: Date[]): MessageBasedXpRateResult {
	if (dates.length < 2) {
		return {is : false, rate : 0, calcs : null};
	}

	const results = getSpamResult(dates);

	const calcs: XpCalculations = {
		counter         : results.spamCounter,
		lotsOfMessaging : results.duration.asMinutes() <= 2,
		fastMessaging   : (results.spamCounter >= (dates.length / 2.5)),
		xpReducer       : results.duration.asSeconds() / 30,
		durationAs      : {
			s : results.duration.asSeconds(),
			h : results.duration.asHours(),
		}
	};

	const {fastMessaging, lotsOfMessaging, xpReducer} = calcs;

	const isSpam = (fastMessaging || lotsOfMessaging);

	calcs.is = isSpam;

	// If it's spammy, we'll take the base xp(30 in the case of messages)
	// We'll then divide 30 by xpReducer to deduct xp.
	if (isSpam) {
		return {is : true, rate : xpReducer, calcs};
	}

	// If it's not spammy, we'll reward the user
	// So we'll take the base, for x 30, and add
	// the avg message time in hours to the base
	return {is : false, rate : results.duration.asHours(), calcs};
}

function finalXpValueFromCalc(baseXp: number, newXp: number): number {
	if (!_.isFinite(newXp)) {
		return baseXp;
	}

	return _.max([1, Math.floor(newXp)]);
}

export async function getNewSpamInflictedXp(xp: number, user: User): Promise<[number, XpCalculations]> {
	const times  = await user.getLastMessageTimes();
	const result = getMessageBasedXpRate(times);

	if (result.rate === 0) {
		return [xp, null];
	}

	if (result.is) {
		return [finalXpValueFromCalc(xp, xp / result.rate), result.calcs];
	}

	return [finalXpValueFromCalc(xp, xp + result.rate), result.calcs];
}

export async function sendSpamLogs(channel: string = 'mod-logs', users: User[] = []) {
	if (!users?.length) {
		users = await User.where<User>({
			'spamInfo.is' : true
		}).get();
	}

	if (!users?.length) {
		return false;
	}

	for (let user of users) {
		const info = user.spamInfo;
		getChannel(channel).send({embed : user.spamCalcsEmbed()});
	}

	return true
}
