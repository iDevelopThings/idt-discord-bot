import {Log} from "@envuso/common";
import {GuildMember, ColorResolvable} from "discord.js";
import {guild} from "../../Util/Bot";
import NumberInput from "../../Util/NumberInput";
import User from "./User";

export interface ISkill {
	level: number;
	xp: number;
}

interface SkillInformation {
	title: string;
	color: ColorResolvable;
}

export type SkillRequirementValues = {
	skill: SkillName;
	level: number;
}

export type SkillRequirements = SkillRequirementValues[];

export const AvailableSkills = {
	chatting  : {
		title : 'Chatting',
		color : 'BLURPLE'
	},
	investing : {
		title : 'Investing',
		color : "GREEN"
	},
	gambling  : {
		title : 'Gambling',
		color : "GOLD"
	},
	hacking   : {
		title : 'Hacking',
		color : "NOT_QUITE_BLACK"
	},
};

export type SkillName = keyof (typeof AvailableSkills);

export default class Skills {

	constructor(private user: User) {}

	/**
	 * Get the level for a specified amount of xp
	 *
	 * @param exp
	 * @returns {number}
	 */
	static levelForXp(exp: number) {
		let points = 0;
		let output = 0;
		for (let lvl = 1; lvl <= 100; lvl++) {
			points += Math.floor(lvl + 100.0 * Math.pow(2.0, lvl / 7.0));
			output = Math.floor(points / 2);

			if ((output - 1) >= exp) {
				return lvl;
			}
		}
		return 99;
	}

	/**
	 * Get the xp required for a specific level
	 *
	 * @param level
	 * @returns {number}
	 */
	static xpForLevel(level: number) {
		let points = 0;
		let output = 0;
		for (let lvl = 1; lvl <= level; lvl++) {
			points += Math.floor(lvl + 100.0 * Math.pow(2.0, lvl / 7.0));
			if (lvl >= level) {
				return output;
			}
			output = Math.floor(points / 2);
		}
		return 0;
	}

	/**
	 *
	 * @param {SkillName} skill
	 * @param {number} xp
	 */
	addXp(skill: SkillName, xp: number) {
		const currentXp = NumberInput.someFuckingValueToInt(this.user.skills[skill].xp);

		const originalLevel = Skills.levelForXp(currentXp);
		const newLevel      = Skills.levelForXp(currentXp + xp);
		const member        = guild().members.cache.get(this.user.id);

		if (newLevel > originalLevel && this.user.preference('botDmMessages')) {
			// Do this in the background... Don't really care
			this.sendLevelUpMessage(member, skill, newLevel);
		}

		this.user.skills[skill].xp += xp;
		this.user.skills[skill].level = newLevel;

		this.user.queuedBuilder()
			.increment(`skills.${skill}.xp`, xp.toString())
			.set({[`skills.${skill}.level`] : newLevel});
	}

	/**
	 * Does the user have all levels required in the skills array?
	 *
	 * @param {SkillRequirements} requirements
	 * @returns {{failedRequirements: SkillRequirementValues[], meetsRequirements: boolean}}
	 */
	hasLevels(requirements: SkillRequirements) {
		const failedRequirements: SkillRequirements = [];

		for (let requirement of requirements) {
			if (!this.has(requirement.level, requirement.skill)) {
				failedRequirements.push(requirement);
			}
		}

		return {
			meetsRequirements  : (!failedRequirements.length),
			failedRequirements : failedRequirements
		};
	}

	has(level: number, skill: SkillName) {
		return this.user.skills[skill].level >= level;
	}

	private async sendLevelUpMessage(member: GuildMember, skill: SkillName, level: number) {
		if(member.user.bot) {
			return;
		}

		try {
			await this.user.sendDm(`You have leveled up ${AvailableSkills[skill].title}. You are now level ${level}\n**You can disable these messages with the command /preferences settings**`);
		} catch (error) {
			Log.error('Cannot dm user: ' + member.displayName + ' from add xp method. ' + error.toString());
		}
	}
}
