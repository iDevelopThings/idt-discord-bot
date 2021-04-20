import {Log} from "@envuso/common";
import Keyv from "keyv";
import {database} from "../Models/ModelHelper";
const KeyvMongo = require('@keyv/mongo');


type IBotSettings = {
	gamblingWebhookId: string;
	gamblingWebhookToken: string;
	recentMemes: string[];
}
type SettingKey = keyof IBotSettings;

let cache = null;

async function init() {
	cache = new Keyv({
		store : new KeyvMongo({db : database})
	});

	cache.on('error', err => {
		Log.error('Error with keyv settings');
		console.trace(err);
	});
}

function get<T>(key: SettingKey): Promise<T> {
	return cache.get(key);
}

async function set(key: SettingKey, value: any, ttl?: number): Promise<true> {
	return cache.set(key, value, ttl);
}

function remove(key: SettingKey): Promise<boolean> {
	return cache.delete(key);
}

async function clear(): Promise<void> {
	return cache.clear();
}

export const BotSettings = {
	init, get, set, remove, clear
};

