import "reflect-metadata";
import {config} from 'dotenv';

config();
import './Util/Date';
import {Log} from "@envuso/common";
import DatabaseManager from "./Core/Database/DatabaseManager";
import DiscordJsManager from "./Core/Discord/DiscordJsManager";
import {loadDiscordEventHandlers} from "./Core/Discord/EventHandlers";
import SlashCreatorManager from "./Core/Discord/SlashCreatorManager";
import {guild} from "./Util/Bot";
import CronHandler from "./Handlers/CronJob/CronHandler";

const cronHandler     = new CronHandler();
const databaseManager = new DatabaseManager();

DiscordJsManager.get().boot();
SlashCreatorManager.get().boot();


async function boot() {
	loadDiscordEventHandlers();

	await databaseManager.boot();

	await DiscordJsManager.get().run();

	await guild().roles.fetch();

	await SlashCreatorManager.get().sync();

	await cronHandler.boot();
	//	ActivityEndedCron.start();

}

boot().then(() => Log.info('Le bot is running'));

