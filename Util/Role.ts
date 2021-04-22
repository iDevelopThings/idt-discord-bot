import {GuildMember, Role} from "discord.js";
import {CommandPermissions, Member} from "slash-create";
import {guild, guildId} from "./Bot";

/**
 * Ehhhh we need a way to get all roles easily
 *
 * @returns {Role[]}
 */
export const adminRoles = (): Role[] => {
	const adminRoles = [];

	const ownerRole = guild().roles.cache.find(r => r.name === 'Owner');
	if (ownerRole) adminRoles.push(ownerRole);

	const adminRole = guild().roles.cache.find(r => r.name === 'Admin');
	if (adminRole) adminRoles.push(adminRole);

	const vipRole = guild().roles.cache.find(r => r.name === 'VIP IN THIS BITCH');
	if (vipRole) adminRoles.push(vipRole);

	return adminRoles;
};

export const getRole = (role: string): Role => {
	return guild().roles.cache.find(r => r.name.toLowerCase() === role.toLowerCase());
};

/**
 * Get roles from the Guild (case-insensitive)
 *
 * @param {...string} roles
 * @return {Role[]}
 */
export const getRoles = (...roles: string[]): Role[] => {
	const resolvedRoles = [];

	for (const name of roles) {
		const role = getRole(name);

		if (!role) {
			continue;
		}

		resolvedRoles.push(role);
	}

	return resolvedRoles;
};

export const mapRolesToCommandPermissions = (roles: Role[]): CommandPermissions => {
	const permissions = {};

	permissions[guildId] = roles.map(role => ({
		id         : role.id,
		type       : 1,
		permission : true
	}));

	return permissions;
};

export const hasRole = (user: Member | GuildMember, ...roles: string[]): boolean => {
	const resolvedRoles = getRoles(...roles).map(r => r.id);

	if (user instanceof Member) {
		return user.roles.some(roleId => resolvedRoles.includes(roleId));
	}

	if (user instanceof GuildMember) {
		return user.roles.cache.some(role => resolvedRoles.includes(role.id));
	}

	return false;
};

/**
 * Admin permissions used in command permissions
 *
 * @returns {CommandPermissions}
 */
export const adminPermissionsForCommand = (): CommandPermissions => {

	const permissions = {};

	permissions[guildId] = adminRoles().map(role => {
		return {
			id         : role.id,
			type       : 1,
			permission : true,
		};
	});

	return permissions;
};

/**
 * Easier way to check if the user is an admin
 *
 * @param {Member | GuildMember} user
 * @returns {boolean}
 */
export const isAdmin = (user: Member | GuildMember) => {

	const roleIds = adminRoles().map(r => r.id);

	if (user instanceof Member) {
		return user.roles.some(id => roleIds.includes(id));
	}

	if (user instanceof GuildMember) {
		return user.roles.cache.some(role => roleIds.includes(role.id));
	}

	return false;
};
