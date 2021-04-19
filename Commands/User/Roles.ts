import {MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import {GamblingColor} from "../../Handlers/Gambling/Gambling";
import {AvailableSkills} from "../../Models/User/Skills";
import User from "../../Models/User/User";
import {guild, guildId} from "../../Util/Bot";
import {formatXp, numbro} from "../../Util/Formatter";

const roleChoices = [
	{name : 'Developer Role', value : 'Developer'},
	{name : 'Gaming Role', value : 'Epic Gamers'},
	{name : 'Devops Role', value : 'DevOps'},
];

export default class Roles extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs    : guildId,
			name        : 'roles',
			description : 'Toggle specific roles for your user, hiding/showing parts of the discord.',
			options     : [
				{
					name        : 'role',
					description : 'A role to add/remove',
					type        : CommandOptionType.STRING,
					required    : true,
					choices     : roleChoices
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const roleName = ctx.options.role as string;

		if (!roleChoices.some(r => r.value === roleName)) {
			return 'Somehow this role doesnt exist....';
		}

		const user = guild().members.resolve(ctx.user.id);

		if (!user) {
			return 'Hmmm something borked aye';
		}

		const role = guild().roles.cache.find(r => r.name === roleName);

		if (!role) {
			return 'Cant get the role....';
		}

		if (user.roles.cache.has(role.id)) {
			await user.roles.remove(role);

			return `Removed the ${role.name} role.`;
		}

		await user.roles.add(role);

		return `Added the ${role.name} role.`;
	}
}
