import {GuildMember, Role} from "discord.js";
import {CommandPermissions, Member} from "slash-create";
import {guild, guildId} from "./Bot";

/**
 *
 * @param {string} role
 * @returns {Role}
 */
export const getRole = (role: string): Role => guild().roles.cache.find(r => r.name.toLowerCase() === role.toLowerCase());

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

/**
 *
 * @param {Role[]} roles
 * @returns {CommandPermissions}
 */
export const mapRolesToCommandPermissions = (roles: Role[]): CommandPermissions => {
	const permissions = {};

	permissions[guildId] = roles.map(role => ({
		id         : role.id,
		type       : 1,
		permission : true
	}));

	return permissions;
};

/**
 *
 * @param {Member | GuildMember} user
 * @param {string} roles
 * @returns {boolean}
 */
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
 * Returns all "Admin" roles
 *
 * @returns {Role[]}
 */
export const adminRoles = (): Role[] => getRoles('owner', 'admin', 'vip in this bitch');

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
export const isAdmin = (user: Member | GuildMember) => hasRole(user, ...adminRoles().map(r => r.name));
