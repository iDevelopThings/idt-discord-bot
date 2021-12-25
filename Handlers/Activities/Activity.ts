import {Log} from "@envuso/common";
import {Duration} from "dayjs/plugin/duration";
import {ColorResolvable, MessageEmbed} from "discord.js";
import {ActivityName, IActivities} from "../../Models/User/Activities";
import {SkillRequirements} from "../../Models/User/Skills";
import User from "../../Models/User/User";
import {getChannel, getGuildMember, guild, sendEmbedInChannel} from "../../Util/Bot";
import {dayjs, timeRemaining} from "../../Util/Date";
import {formatMoney, Numbro, percentOf} from "../../Util/Formatter";
import NumberInput, {SomeFuckingValue} from "../../Util/NumberInput";
import {getRandomInt} from "../../Util/Random";
import {activityList} from "./ActivityList";

export interface CompletionChances {
	regular: { min: number; max: number };
	lucky: { min: number; max: number };
	money: { min: number; max: number };
}

export type RandomEventInformation = {
	name: RandomEventNames;
	chance: number;
	message: string;
	additionalHandling: (price: SomeFuckingValue) => Promise<string>;
}

export enum RandomEventNames {
	COPS            = "Cops",
	GRANDMA_SLIPPED = "Grandma Slipped"
}

export enum ActivityType {
	LEGAL,
	ILLEGAL,
	HEIST
}

export type RandomEvents = RandomEventInformation[];

export interface SuccessfulResponse {
	moneyGained: number;
	message: string;
}

interface ActivitiesListItem {
	name: string;
	value: string;
	class: typeof Activity;
	classInstance: (user: User) => Activity;
	color: ColorResolvable;
}

export default abstract class Activity {
	public static type: ActivityType = ActivityType.LEGAL;

	private activityInformation: IActivities;

	constructor(activityInformation: IActivities) {
		this.activityInformation = activityInformation;
	}

	static activitiesForCommandChoices(type?: ActivityType) {
		let activities = activityList;

		if (type !== undefined) {
			activities = activities.filter(activity => activity.class.type === type);
		}

		return activities.map(({name, value}) => ({name, value}));
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
				reason : `${this.title()} is still in progress... it will finish in ${timeRemaining(manager.get(this.name()).endsAt)}`
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
				reason : `${this.title()} will cost ${formatMoney(this.startingCost())} to purchase the required assets... you cannot afford this right now.`
			};
		}

		return {
			isAble : true,
			reason : 'none'
		};
	}

	abstract getCompletionChances(): CompletionChances;

	start(user: User) {
		return user.activityManager()
			.setStarted(this.name(), this)
			.balanceManager()
			.deductFromBalance(
				this.startingCost().value(),
				`Started activity - ${this.title()}`
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
			const member         = await getGuildMember(user.id);
			const randomAmt      = percentOf(this.startingCost().multiply(2).value().toString(), getRandomInt(10, 30).toString() + '%');
			const dm             = await member.createDM();
			const additionalInfo = await event.additionalHandling(randomAmt);


			await user.balanceManager()
				.deductFromBalance(randomAmt, `${this.title()} random event - ${event.name}`)
				.executeQueued();

			getChannel('activities').send({
				embeds : [
					new MessageEmbed()
						.setAuthor(user.embedAuthorInfo)
						.setTitle(this.title())
						.setDescription(`${user.toString()} It all went down during ${this.title()}... \n${event.message}\n${additionalInfo}`)
						.addField('Cost: ', formatMoney(randomAmt), true)
						.setColor('DARK_RED')
				]
			});

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
			`Successfully completed ${this.title()}`
		);
		user.activityManager().removeActivity(this.name());
		await user.executeQueued();

		sendEmbedInChannel(
			'activities',
			new MessageEmbed()
				.setAuthor(user.embedAuthorInfo)
				.setTitle(this.title())
				.setDescription(`${user.toString()} ${response.message}`)
				.addField('Gains: ', formatMoney(response.moneyGained))
				.setColor('GREEN')
		);

	}
}
