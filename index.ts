import {ClientEvents} from "discord.js";
import {config} from 'dotenv';

config();
import './Util/Date';
import {Log} from "@envuso/common";
import * as Discord from 'discord.js';
import * as path from 'path';
import {GatewayServer, SlashCreator} from "slash-create";
import BaseEventHandler from "./EventHandlers/BaseEventHandler";
import {database} from "./Models/ModelHelper";
import {guild, guildId} from "./Util/Bot";

const client  = new Discord.Client();
const creator = new SlashCreator({
	applicationID : process.env.APPLICATION_ID,
	//	publicKey     : process.env.CLIENT_PUBLIC_KEY,
	token : process.env.BOT_TOKEN,
});

creator.on('debug', (message) => Log.info('debug: ' + message));
creator.on('warn', (message) => Log.warn(message));
creator.on('error', (error) => Log.error(error, error));
creator.on('synced', () => Log.info('Commands synced!'));
creator.on('commandRun', (command, _, ctx) => Log.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`));
creator.on('commandRegister', (command) => Log.info(`Registered command ${command.commandName}`));
creator.on('commandError', (command, error) => {
	Log.error(`Command ${command.commandName}`);
	console.trace(error);
});

export const boundEvents: (keyof ClientEvents)[] = [];

function loadDiscordEventHandlers() {
	const eventHandlers: { [key: string]: any } = require('require-all')({
		dirname   : path.join(__dirname, 'EventHandlers'),
		recursive : true,
		filter    : /^(.+)\.(j|t)s$/,
		resolve   : function (Handler) {
			return new Handler.default();
		}
	});

	for (let eventHandlersKey in eventHandlers) {

		if (eventHandlersKey === 'BaseEventHandler') continue;

		const handler = eventHandlers[eventHandlersKey];

		if (!(handler instanceof BaseEventHandler)) {
			Log.error('Event handler class ' + eventHandlersKey + ' does not event BaseEventHandler');
			continue;
		}

		handler.bindListener();

		boundEvents.push(handler.getEventName());

	}

}

async function boot() {
	loadDiscordEventHandlers();
	await database.connect();

	await client.login(process.env.BOT_TOKEN);

	client.on('error', error => {
		Log.error('Error from discord.js: ' + error.toString());
		console.trace(error);
	});

	await guild().roles.fetch();

	const gateway = new GatewayServer((handler) => {
		//@ts-ignore
		client.ws.on('INTERACTION_CREATE', handler);
	});

	await creator.withServer(gateway).registerCommandsIn({
		dirname   : path.join(__dirname, 'Commands'),
		recursive : true,
		filter    : /^(.+)\.(j|t)s$/,
	});
	await creator.syncCommandsIn(guildId, true);
	await creator.syncCommandPermissions();

	//	ActivityEndedCron.start();
}

boot().then(() => Log.info('Le bot is running'));


export {
	client
};
