import {GuildMember, MessageEmbed} from "discord.js";
import {CommandOptionType, SlashCommand} from "slash-create";
import CommandContext from "slash-create/lib/context";
import User from "../../Models/User/User";
import {IPreferences} from "../../Models/User/UserInformationInterfaces";
import UserManager from "../../Models/User/UserManager";
import {guild, guildId} from "../../Util/Bot";


export default class Preferences extends SlashCommand {

	constructor(creator) {
		super(creator, {
			guildIDs    : guildId,
			name        : 'preferences',
			description : 'Toggle specific preferences for the discord',
			options     : [
				{
					name        : 'channels',
					description : 'Channels to show/hide',
					type        : CommandOptionType.STRING,
					choices     : [
						{name : 'Toggle hidden News', value : 'hidden:news'},
						{name : 'Toggle hidden Announcements', value : 'hidden:announcements'},
						{name : 'Toggle hidden Gambling', value : 'hidden:gambling'},
					]
				},
				{
					name        : 'settings',
					description : 'Other settings',
					type        : CommandOptionType.STRING,
					choices     : [
						{name : 'Toggle bot dms(stops level up notifications)', value : 'botDmMessages'},
					]
				}
			]
		});
		this.filePath = __filename;
	}


	async run(ctx: CommandContext) {
		const discordUser = await UserManager.getDiscordUser(ctx.user.id);
		const user        = await User.getOrCreate(ctx.user.id);

		if (!ctx.options.channels && !ctx.options.settings) {
			return this.returnCurrentPreferences(discordUser, user);
		}

		let output = 'Changes: \n';

		if (ctx.options.channels) {
			const role = guild().roles.cache.find(r => r.name === ctx.options.channels);

			if (discordUser.roles.cache.has(role.id)) {
				await discordUser.roles.remove(role);
				output += `- Removed ${role.name} role \n`;
			} else {
				await discordUser.roles.add(role);
				output += `- Added ${role.name} role \n`;
			}
		}


		if (ctx.options.settings) {

			const allowedSettings: (keyof IPreferences)[] = ['botDmMessages'];

			if (!allowedSettings.includes(ctx.options.settings as keyof IPreferences)) {
				throw new Error('Disallowed user setting...');
			}

			for (let allowedSetting of allowedSettings) {
				user.queuedBuilder().set({
					[`preferences.${allowedSetting}`] : !user.preferences[allowedSetting]
				});

				output += `- ${user.preferences[allowedSetting] ? 'Enabled' : 'Disabled'} bot dm messages \n`;
			}

			await user.executeQueued();
		}

		return output;
	}

	private returnCurrentPreferences(discordUser: GuildMember, user: User) {
		const channelsEmbed = new MessageEmbed()
			.setColor(user.color)
			.setTitle('Channels');

		const channelTypes = [
			{'roleName' : 'hidden:news', title : 'News Channel'},
			{'roleName' : 'hidden:announcements', title : 'Announcements Channel'},
			{'roleName' : 'hidden:gambling', title : 'Gambling Channels'},
		];

		channelTypes.forEach(({roleName, title}) => {
			const role = guild().roles.cache.find(r => r.name === roleName);

			if (!role) {
				throw new Error('Somethings messed up bruh');
			}

			channelsEmbed.addField(title, discordUser.roles.cache.has(role.id) ? 'Hidden' : 'Visible', true);
		});

		return {
			embeds : [
				channelsEmbed,
				new MessageEmbed()
					.setColor(discordUser.displayHexColor)
					.setTitle('Preferences')
					.addField(`Bot Direct Messages`, user?.preferences?.botDmMessages ? 'Receiving' : 'Not Receiving')
			]
		};
	}
}
