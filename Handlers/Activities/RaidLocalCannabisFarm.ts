import {Duration} from "dayjs/plugin/duration";
import {ActivityName} from "../../Models/User/Activities";
import {SkillRequirements} from "../../Models/User/Skills";
import {createDuration} from "../../Util/Date";
import {formatMoney, Numbro, numbro} from "../../Util/Formatter";
import {getRandomInt} from "../../Util/Random";
import IllegalActivity, {RandomEventNames, RandomEvents, SuccessfulResponse} from "./IllegalActivity";

export default class RaidLocalCannabisFarm extends IllegalActivity {

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

	public async getMessageAndBalanceGain(): Promise<SuccessfulResponse> {
		let randomPlantsNumber = getRandomInt(10, 30);
		if (randomPlantsNumber > 20) {
			randomPlantsNumber = getRandomInt(25, 60);
		}
		const costForPlants = randomPlantsNumber * getRandomInt(200, 500);

		let message = `You just about got away, the owner came for your ass. You stole ${randomPlantsNumber} plants, they're worth a total of ${formatMoney(costForPlants)}`;

		if (randomPlantsNumber > 25) {
			message = `You managed to get away with the raid... You got extremely lucky stole ${randomPlantsNumber} plants, they're worth a total of ${formatMoney(costForPlants)}`;
		}

		return {
			message     : message,
			moneyGained : costForPlants
		};

	}

}
