import {Log} from "@envuso/common";
import path from "path";
import {GatewayServer, SlashCreator} from "slash-create";
import {getFiles} from "slash-create/lib/util";
import {guildId} from "../../Util/Bot";
import DiscordJsManager from "./DiscordJsManager";

let instance = null;

export default class SlashCreatorManager {

	private _creator: SlashCreator;

	static get(): SlashCreatorManager {
		if (instance) return instance;

		instance = new this();

		return instance;
	}

	boot() {
		this._creator = new SlashCreator({
			applicationID         : process.env.APPLICATION_ID,
			token                 : process.env.BOT_TOKEN,
			maxSignatureTimestamp : 10000
		});

		this._creator.on('debug', (message) => Log.info('debug: ' + message));
		this._creator.on('warn', (message) => Log.warn(message));
		this._creator.on('error', (error) => Log.error(error, error));
		this._creator.on('synced', () => Log.info('Commands synced!'));
		//		this._creator.on('commandRun', (command, _, ctx) => Log.info(`${ctx.user.username}#${ctx.user.discriminator} (${ctx.user.id}) ran command ${command.commandName}`));
		this._creator.on('commandRegister', (command) => Log.info(`Registered command ${command.commandName}`));
		this._creator.on('commandError', (command, error) => {
			Log.error(`Command ${command.commandName}`);
			console.trace(error);
		});
	}

	async sync() {
		const gateway = new GatewayServer((handler) => {
			//@ts-ignore
			DiscordJsManager.client().ws.on('INTERACTION_CREATE', handler);
		});

		console.log(path.join(process.cwd(), 'Commands'));

		await this._creator.withServer(gateway);

		const commands = getFiles(path.join(process.cwd(), 'Commands')).map(command => require(command));
		this._creator.registerCommands(commands, true);

		//		await this._creator.syncCommandsIn(guildId, true);
		//		await this._creator.syncCommandPermissions();
		this._creator.syncCommands({
			syncGuilds      : true,
			syncPermissions : true,
			deleteCommands  : true,
			skipGuildErrors : false,
		});
	}

}
