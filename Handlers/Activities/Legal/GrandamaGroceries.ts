import {Duration} from "dayjs/plugin/duration";
import {ActivityName} from "../../../Models/User/Activities";
import {SkillRequirements} from "../../../Models/User/Skills";
import {createDuration} from "../../../Util/Date";
import {formatMoney, Numbro, numbro} from "../../../Util/Formatter";
import {getRandomInt} from "../../../Util/Random";
import Activity, {ActivityType, CompletionChances, RandomEventNames, RandomEvents, SuccessfulResponse} from "../Activity";

export default class GrandamaGroceries extends Activity {
	public static type: ActivityType = ActivityType.LEGAL;

	public title(): string {
		return 'Help Grandma with Groceries';
	}

	public name(): ActivityName {
		return 'grandma_groceries';
	}

	public levelRequirements(): SkillRequirements {
		return [];
	}

	public randomEvents(): RandomEvents {
		return [
			{
				name               : RandomEventNames.GRANDMA_SLIPPED,
				chance             : 10,
				message            : 'Grandma slipped and broke her hip... <:sob:836334202281525288>',
				additionalHandling : async (price) => {
					return `** You helped Grandma pay the hospital bill of ${formatMoney(price)}... be careful next time. **`;
				}
			}
		];
	}

	public runsFor(): Duration {
		return createDuration(1, 'minutes');
	}

	public startingCost(): Numbro {
		return numbro('100');
	}

	public getCompletionChances(): CompletionChances {
		return {
			regular : {min : 1, max : 5},
			lucky   : {min : 5, max : 10},
			money   : {min : 50, max : 100}
		};
	}

	public async getMessageAndBalanceGain(): Promise<SuccessfulResponse> {
		const chances   = this.getCompletionChances();
		let payoutMulti = getRandomInt(chances.regular.min, chances.regular.max);

		if (payoutMulti > chances.lucky.min) {
			payoutMulti = getRandomInt(chances.lucky.min, chances.lucky.max);
		}

		const costForPlants = payoutMulti * getRandomInt(chances.money.min, chances.money.max);
		const message       = `Grandma got home safely with her groceries. She gave you ${formatMoney(costForPlants)} as thanks <:angel:836334935870275605>`;

		return {
			message     : message,
			moneyGained : costForPlants
		};
	}
}
