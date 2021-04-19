import {createDuration, dayjs} from "../../Util/Date";
import {UserInstance} from "./UserInstance";

export interface ITimeStates {
	claim?: string;
	withdrawInvestment?: string;
	botHack?: string;
}

export const TimeStates = {
	claim              : createDuration(30, 'minutes'),
	withdrawInvestment : createDuration(30, 'minutes'),
	botHack            : createDuration(60, 'minutes'),
	userHack            : createDuration(15, 'minutes'),
};

export type TimeStateName = keyof (typeof TimeStates);

export default class Cooldown {

	constructor(private user: UserInstance) {}

	async setUsed(state: TimeStateName) {
		this.user.cooldowns[state] = dayjs().add(TimeStates[state]).format();
		await this.user.save();
	}

	canUse(state: TimeStateName) {
		const cooldownDate = this.user.cooldowns[state];

		if (!cooldownDate) {
			return true;
		}

		return dayjs().isAfter(dayjs(cooldownDate));
	}

	timeLeft(state: TimeStateName, humanize = false) {
		const cooldownDate = this.user.cooldowns[state];

		if (!cooldownDate) {
			return 0;
		}

		if (humanize) {
			return dayjs(cooldownDate).fromNow(true);
		}

		return dayjs(cooldownDate).diff(dayjs());
	}

}
