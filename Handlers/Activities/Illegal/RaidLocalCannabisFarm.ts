import {Duration} from "dayjs/plugin/duration";
import {ActivityName} from "../../../Models/User/Activities";
import {SkillRequirements} from "../../../Models/User/Skills";
import {createDuration} from "../../../Util/Date";
import {formatMoney, Numbro, numbro} from "../../../Util/Formatter";
import {getRandomInt} from "../../../Util/Random";
import Activity, {ActivityType, CompletionChances, RandomEventNames, RandomEvents, SuccessfulResponse} from "../Activity";

export default class RaidLocalCannabisFarm extends Activity {
	public static type: ActivityType = ActivityType.ILLEGAL;

	public title(): string {
		return 'Local Cannabis Farm Raid';
	}

	public name(): ActivityName {
		return 'raid_local_cannabis';
	}

	public levelRequirements(): SkillRequirements {
		return [
			{
				skill : 'hacking',
				level : 5
			}
		];
	}

	public randomEvents(): RandomEvents {
		return [
			{
				name               : RandomEventNames.COPS,
				chance             : 15,
				message            : 'Someone saw you sneak inside and called the cops.... busted.',
				additionalHandling : async (price) => {
					return `**It cost you ${formatMoney(price)} to bail out of jail... damn, sucks to suck. **`;
				}
			}
		];
	}

	public runsFor(): Duration {
		return createDuration(10, 'minutes');
	}

	public startingCost(): Numbro {
		return numbro('10000');
	}

	public getCompletionChances(): CompletionChances {
		return {
			regular : {min : 10, max : 20},
			lucky   : {min : 15, max : 25},
			money   : {min : 600, max : 1000}
		};
	}

	public async getMessageAndBalanceGain(): Promise<SuccessfulResponse> {
		const chances          = this.getCompletionChances();
		let randomPlantsNumber = getRandomInt(chances.regular.min, chances.regular.max);

		if (randomPlantsNumber > chances.lucky.min) {
			randomPlantsNumber = getRandomInt(chances.lucky.min, chances.lucky.max);
		}

		const costForPlants = randomPlantsNumber * getRandomInt(chances.money.min, chances.money.max);

		let message = `You just about got away, the owner came for your ass. You stole ${randomPlantsNumber} plants, they're worth a total of ${formatMoney(costForPlants)}`;

		if (randomPlantsNumber > chances.lucky.min) {
			message = `You managed to get away with the raid... You got extremely lucky stole ${randomPlantsNumber} plants, they're worth a total of ${formatMoney(costForPlants)}`;
		}

		return {
			message     : message,
			moneyGained : costForPlants
		};
	}
}
