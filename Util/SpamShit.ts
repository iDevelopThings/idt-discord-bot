import {Duration} from "dayjs/plugin/duration";
import _ from "lodash";
import Configuration from "../Configuration";
import User from "../Models/User/User";
import {getChannel} from "./Bot";
import {createDuration} from "./Date";

export function getSpamResult(dates: Date[]): { spamCounter: number, avg: number, hours: number, duration: Duration } {
	let spamCounter = 0;
	let diffs       = [];

	for (let i = 0; i < dates.length - 1; i++) {
		const curr = dates[i].getTime();
		const next = dates[i + 1].getTime();

		if ((curr - next) <= (1000 * 5)) {
			spamCounter++;
		}

		diffs.push(curr - next);
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

export async function shouldReduceXp(user: User): Promise<boolean> {
	const msgs   = await user.getLastMessageTimesThisMinute();
	const result = getSpamResult(msgs);

	return result.duration.asSeconds() < 5;
}


export function getMessageBasedXpRate(dates: Date[]): MessageBasedXpRateResult {
	if (dates.length < 2) {
		return {is : false, rate : 0, calcs : null};
	}

	const results         = getSpamResult(dates);
	const lotsOfMessaging = results.duration.asSeconds() <= 20;
	const fastMessaging   = false;//results.spamCounter >= ((Configuration.spamMessageHistoryLookBack / 4) * 3);
	const isSpam          = (fastMessaging || lotsOfMessaging);

	const xpReducer = isSpam
		? results.duration.asSeconds()
		: _.min([1000, results.duration.asHours()]);

	const calcs: XpCalculations = {
		lotsOfMessaging, fastMessaging, xpReducer,
		counter    : results.spamCounter,
		durationAs : {
			s : results.duration.asSeconds(),
			h : results.duration.asHours(),
		}
	};

	calcs.is = isSpam;

	// If it's spammy, we'll take the base xp(30 in the case of messages)
	// We'll then divide 30 by xpReducer to deduct xp.
	if (isSpam) {
		return {is : true, rate : xpReducer, calcs};
	}

	// If it's not spammy, we'll reward the user
	// So we'll take the base, for x 30, and add
	// the avg message time in hours to the base
	return {is : false, rate : xpReducer, calcs};
}

function finalXpValueFromCalc(forSpam: boolean, baseXp: number, newXp: number): number {
	if (!_.isFinite(newXp)) {
		return baseXp;
	}

	if (forSpam) {
		newXp = Math.floor(newXp);

		return _.max([1, (newXp > 30 ? 30 : newXp)]);
	}


	return _.max([1, newXp]);
}

export function getXpResult(xp: number, times: Date[]): [number, XpCalculations] {
	const result = getMessageBasedXpRate(times);

	if (result.rate === 0) {
		return [xp, null];
	}

	if (result.is) {
		return [finalXpValueFromCalc(result.is, xp, xp / result.rate), result.calcs];
	}

	return [finalXpValueFromCalc(result.is, xp, xp + result.rate), result.calcs];
}

export async function getNewSpamInflictedXp(xp: number, user: User): Promise<[number, XpCalculations]> {
	const times = await user.getLastMessageTimes();

	return getXpResult(xp, times);
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

	const tChannel = getChannel(channel);

	for (let user of users) {
		const info = user.spamInfo;
		tChannel.send({embed : user.spamCalcsEmbed()});
	}

	return true;
}
