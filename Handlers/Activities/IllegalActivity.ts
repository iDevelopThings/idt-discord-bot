import {Log} from "@envuso/common";
import {Duration} from "dayjs/plugin/duration";
import {MessageEmbed} from "discord.js";
import {ActivityName, IActivities} from "../../Models/User/Activities";
import {SkillName, SkillRequirements} from "../../Models/User/Skills";
import User from "../../Models/User/User";
import {getChannel, guild} from "../../Util/Bot";
import {dayjs, timeRemaining} from "../../Util/Date";
import {formatMoney, Numbro, percentOf, title} from "../../Util/Formatter";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import {getRandomInt} from "../../Util/Random";


export type RandomEventInformation = {
	name: RandomEventNames;
	chance: number;
	message: string;
	additionalHandling: (price: SomeFuckingValue) => Promise<string>;
}

export enum RandomEventNames {
	COPS = "Cops"
}

export type RandomEvents = RandomEventInformation[];

export interface SuccessfulResponse {
	moneyGained: number;
	message: string
}

export default abstract class IllegalActivity {

	private activityInformation: IActivities;

	constructor(activityInformation: IActivities) {
		this.activityInformation = activityInformation;
	}

	abstract title(): string;

	abstract name(): ActivityName;

	abstract runsFor(): Duration;

	abstract startingCost(): Numbro;

	abstract randomEvents(): RandomEvents;

	abstract levelRequirements(): SkillRequirements;

	async canStart(user: User): Promise<{ isAble: boolean; reason: string }> {
		const manager = user.activityManager();

		if (manager.hasActivity(this.name()) && !manager.hasEnded(this.name())) {
			return {
				isAble : false,
				reason : `${title(this.name())} is still in progress... it will finish in ${timeRemaining(manager.get(this.name()).endsAt)}`
			};
		}

		const {failedRequirements, meetsRequirements} = user.skillManager().hasLevels(this.levelRequirements());

		if (!meetsRequirements) {
			const requirements = failedRequirements.map(r => `${r.level} ${r.skill}`).join(', ');

			return {
				isAble : false,
				reason : `You do not meet the skill requirements for this activity... You need ${requirements}.`
			};
		}

		if (!user.balanceManager().hasBalance(this.startingCost().value())) {
			return {
				isAble : false,
				reason : `${title(this.name())} will cost ${formatMoney(this.startingCost())} to purchase the required assets... you cannot afford this right now.`
			};
		}

		return {
			isAble : true,
			reason : 'none'
		};
	}

	start(user: User) {
		return user.activityManager()
			.setStarted(this.name(), this)
			.balanceManager()
			.deductFromBalance(
				this.startingCost().value(),
				`Started activity - ${title(this.name())}`
			)
			.executeQueued();
	}

	/**
	 * Did we fall in the range of the "chance" and have basically failed?
	 *
	 * @returns {null | RandomEventInformation}
	 */
	randomEventHit(): RandomEventInformation {
		const keys     = Object.keys(this.randomEvents());
		const eventKey = keys[Math.floor(keys.length * Math.random())];
		const event    = this.randomEvents()[eventKey];

		// We hit the random event, time to get cucked by the cops.
		if (getRandomInt(0, 100) <= event.chance) {
			return event;
		}

		return null;
	}

	public async handleRandomEvent(user: User, event: RandomEventInformation) {
		try {
			const member         = await guild().member(user.id);
			const randomAmt      = percentOf(this.startingCost().multiply(2).value().toString(), getRandomInt(10, 30).toString());
			const dm             = await member.createDM();
			const additionalInfo = await event.additionalHandling(randomAmt);


			await user.balanceManager()
				.deductFromBalance(randomAmt, `${this.title} random event - ${event.name}`)
				.executeQueued();

			getChannel('activities').send(
				new MessageEmbed()
					.setAuthor(user.displayName, user.getAvatar())
					.setTitle(this.title())
					.setDescription(`${user.toString()} It all went down during ${this.title()}... \n${event.message}\n${additionalInfo}`)
					.addField('Cost: ', formatMoney(randomAmt), true)
					.setColor("DARK_RED")
			);

		} catch (error) {
			Log.error(error.toString());
			console.trace(error);
		}
	}

	hasEnded() {
		return dayjs(this.activityInformation.endsAt).isBefore(new Date());
	}

	/**
	 * Return a response and amount of money for the activity
	 *
	 * @returns {Promise<string>}
	 */
	abstract getMessageAndBalanceGain(): Promise<SuccessfulResponse>;

	/**
	 * When the time is up and we've made it without a random cuck event
	 * We'll call the method on the activity class to create a response
	 * and generate a random amount of money to add to the users balance
	 *
	 * @param {User} user
	 * @returns {Promise<void>}
	 */
	async handleCompletion(user: User) {
		const response = await this.getMessageAndBalanceGain();

		user.balanceManager().addToBalance(
			NumberInput.someFuckingValueToString(response.moneyGained),
			`Successfully completed ${title(this.name())}`
		);
		user.activityManager().removeActivity(this.name());
		await user.executeQueued();

		getChannel('activities').send(
			new MessageEmbed()
				.setAuthor(user.displayName, user.getAvatar())
				.setTitle(this.title())
				.setDescription(`${user.toString()} ${response.message}`)
				.addField('Gains: ', formatMoney(response.moneyGained))
				.setColor("GREEN")
		);
		// We don't need to await this and hold up other processing.
		//		user.sendDm(response.message);
	}
}
