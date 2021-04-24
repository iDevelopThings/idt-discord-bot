import {Duration} from "dayjs/plugin/duration";
import {ActivityName} from "../../Models/User/Activities";
import {createDuration} from "../../Util/Date";
import {Numbro, numbro} from "../../Util/Formatter";
import IllegalActivity, {RandomEvent, SkillRequirement} from "./IllegalActivity";

export default class RaidLocalCannabisFarm extends IllegalActivity {

	public name(): ActivityName {
		return 'raid_local_cannabis';
	}

	public levelRequirement(): SkillRequirement | null {
		return {
			skill : 'hacking',
			level : 5
		};
	}

	public randomEvents(): RandomEvent | null {
		return {
			cops : {
				chance  : 15,
				message : 'Someone saw you sneak inside and called the cops.... busted.'
			}
		};
	}

	public runsFor(): Duration {
		return createDuration(30, 'seconds');
	}

	public startingCost(): Numbro {
		return numbro('10000');
	}

	public successChance(): { min: number; max: number } {
		return {max : 50, min : 70};
	}

}
