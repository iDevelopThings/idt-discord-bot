import "reflect-metadata";
import {config} from 'dotenv';

config();
import './Util/Date';
import {Log} from "@envuso/common";
import Configuration from "./Configuration";
import {loadTransforms} from "./Handlers/Inventory/Item/ItemTypeTransformerObject";
import {Item} from "./Handlers/Inventory/Item/Manager/Item";
import DatabaseManager from "./Core/Database/DatabaseManager";
import DiscordJsManager from "./Core/Discord/DiscordJsManager";
import {loadDiscordEventHandlers} from "./Core/Discord/EventHandlers";
import SlashCreatorManager from "./Core/Discord/SlashCreatorManager";
import {guild} from "./Util/Bot";
import CronHandler from "./Handlers/CronJob/CronHandler";
import * as Sentry from "@sentry/node";
import "@sentry/tracing";


const cronHandler     = new CronHandler();
const databaseManager = new DatabaseManager();

DiscordJsManager.get().boot();
SlashCreatorManager.get().boot();

async function boot() {
	Sentry.init({dsn : Configuration.sentryDsn});

	await Item.loadItemClasses();
	await loadTransforms();

	loadDiscordEventHandlers();

	await databaseManager.boot();

	await DiscordJsManager.get().run();

	await guild().roles.fetch();

	await SlashCreatorManager.get().sync();

	await cronHandler.boot();

}

boot().then(() => Log.info('Le bot is running'));

