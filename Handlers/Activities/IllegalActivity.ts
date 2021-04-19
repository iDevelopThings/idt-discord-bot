import {Log} from "@envuso/common";
import {Duration} from "dayjs/plugin/duration";
import {ActivityName} from "../../Models/User/Activities";
import {SkillName} from "../../Models/User/Skills";
import {UserInstance} from "../../Models/User/UserInstance";
import {guild} from "../../Util/Bot";
import {timeRemaining} from "../../Util/Date";
import {formatMoney, Numbro, percentOf, title} from "../../Util/Formatter";
import {upperFirst, upperCase} from 'lodash/string';
import {getRandomInt} from "../../Util/Random";

export type SkillRequirement = { skill: SkillName; level: number; }

export type RandomEventInformation = {
	chance: number;
	message: string;
}


export type RandomEvent = Record<string, RandomEventInformation>

export default abstract class IllegalActivity {

	abstract name(): ActivityName;

	abstract runsFor(): Duration;

	abstract startingCost(): Numbro;

	abstract randomEvents(): RandomEvent | null;

	abstract successChance(): { min: number; max: number; };

	abstract levelRequirement(): null | SkillRequirement;

	async canStart(user: UserInstance): Promise<{ isAble: boolean; reason: string }> {
		const manager = user.activityManager();

		if (manager.hasActivity(this.name()) && !manager.hasEnded(this.name())) {
			return {
				isAble : false,
				reason : `${title(this.name())} is still in progress... it will finish in ${timeRemaining(manager.get(this.name()).endsAt)}`
			};
		}

		if (!user.balanceManager().hasBalance(this.startingCost().value().toString())) {
			return {
				isAble : false,
				reason : `${title(this.name())} will cost ${formatMoney(this.startingCost())} to purchase the required assets... you cannot afford this right now.`
			};
		}

		if (!user.skillManager().has(this.levelRequirement().level, this.levelRequirement().skill)) {
			return {
				isAble : false,
				reason : `You do not have a high enough ${this.levelRequirement().skill} level for this activity.... you need a level of ${this.levelRequirement().level}.`
			};
		}

		return {
			isAble : true,
			reason : 'none'
		};
	}

	async start(user: UserInstance) {

		await user.activityManager().setStarted(this.name(), this);

		user.balanceManager().deductFromBalance(this.startingCost().value().toString());
		await user.save();

	}

	/**
	 * Did we fall in the range of the "chance" and have basically failed?
	 *
	 * @returns {null | {name: string, message: string}}
	 */
	randomEventHit() {

		const keys     = Object.keys(this.randomEvents());
		const eventKey = keys[Math.floor(keys.length * Math.random())];
		const event    = this.randomEvents()[eventKey];

		// We hit the random event, time to get cucked by the cops.
		if (getRandomInt(0, 100) <= event.chance) {
			return {
				name    : eventKey,
				message : event.message
			};
		}

		return null;
	}

	public async handleRandomEvent(user: UserInstance, event: { name: string; message: string }) {

		try {
			const member    = await guild().member(user.id);
			const randomAmt = percentOf(this.startingCost().multiply(2).value().toString(), getRandomInt(10, 30).toString());

			const dm           = await member.createDM();
			let additionalInfo = '';

			switch (event.name) {
				case 'cops':
					additionalInfo = `**It got expensive... it cost you ${formatMoney(randomAmt)} **`;
					break;
			}

			await dm.send(`It all went down with at the ${title(this.name())}... \n${event.message}\n${additionalInfo}`);

			if (user.balanceManager().hasBalance(randomAmt)) {
				user.balanceManager().deductFromBalance(randomAmt);
				await user.save();
			}
		} catch (error) {
			Log.error(error.toString());
			console.trace(error);
		}
	}
}
