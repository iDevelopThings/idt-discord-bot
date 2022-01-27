import "reflect-metadata";
import {deserialize} from "bson";
import {Buffer} from "buffer";
import {config} from 'dotenv';

config();
import './Util/Date';
import {Log} from "@envuso/common";
import {Money} from "./Handlers/Inventory/Item/Items/Money";
import {loadTransforms} from "./Handlers/Inventory/Item/ItemTypeTransformerObject";
import {ItemWithWeight} from "./Handlers/Inventory/Item/ItemWithWeight";
import {Item} from "./Handlers/Inventory/Item/Manager/Item";
import DatabaseManager from "./Core/Database/DatabaseManager";
import DiscordJsManager from "./Core/Discord/DiscordJsManager";
import {loadDiscordEventHandlers} from "./Core/Discord/EventHandlers";
import SlashCreatorManager from "./Core/Discord/SlashCreatorManager";
import {guild} from "./Util/Bot";
import CronHandler from "./Handlers/CronJob/CronHandler";
import {formatMoney} from "./Util/Formatter";
import {getChanceInstance} from "./Util/Random";


const cronHandler     = new CronHandler();
const databaseManager = new DatabaseManager();

DiscordJsManager.get().boot();
SlashCreatorManager.get().boot();


async function boot() {
	await Item.loadItemClasses();
	await loadTransforms();
	//	ItemTransformGenerator.generateTypescriptDefs();

	loadDiscordEventHandlers();

	await databaseManager.boot();

	await DiscordJsManager.get().run();

	await guild().roles.fetch();

	await SlashCreatorManager.get().sync();

	await cronHandler.boot();

//	const tab = {
//		1_000_000           : {weight : 0, amount : 0, times : 0, total : 0},
//		10_000_000          : {weight : 0, amount : 0, times : 0, total : 0},
//		100_000_000         : {weight : 0, amount : 0, times : 0, total : 0},
//		100_100_000_000     : {weight : 0, amount : 0, times : 0, total : 0},
//		100_000_000_000_000 : {weight : 0, amount : 0, times : 0, total : 0},
//	};
//
//	for (let i = 0; i < 5000; i++) {
//		const chance  = getChanceInstance();
//		const shit    = [
//			ItemWithWeight.create(new Money(1_000_000), 100),
//			ItemWithWeight.create(new Money(10_000_000), 50),
//			ItemWithWeight.create(new Money(100_000_000), 30),
//			ItemWithWeight.create(new Money(100_100_000_000), 15),
//			ItemWithWeight.create(new Money(100_000_000_000_000), 1),
//		];
//		const items   = [];
//		const weights = [];
//
//		shit.forEach((item) => {
//			item.item.weight = item.weight;
//			items.push(item.item);
//			weights.push(item.weight);
//		});
//
//		const item = chance.weighted<Money>(items, weights);
//
//		tab[item.amount].times++;
//		tab[item.amount].weight    = item.weight;
//		tab[item.amount].amount    = item.amount;
//		tab[item.amount].total += item.amount;
//		tab[item.amount].formatted = formatMoney(tab[item.amount].total);
//
//		//		Log.info(`${i}/50 Received(${item.weight}): ${item.name} : ${formatMoney(item.amount)}`);
//	}
//
//	console.table(Object.values(tab));

	//	const cursor = await User.getCollection<any>().find({});
	//	const users  = await cursor.toArray();
	//
	//	const updatedUsers = [];
	//
	//	for (const user of users) {
	//
	//		const iterate = (obj, usr, builtPath, builtPaths) => {
	//			let thisPath       = '';
	//			let thisBuiltPaths = [];
	//
	//			for (let key of Object.keys(obj)) {
	//				const i = obj[key];
	//
	//				if (i?.bytes && !(i instanceof Decimal128)) {
	//					if (!i?.bytes?.buffer) {
	//						debugger;
	//					}
	//
	//					const buff   = Buffer.from(i.bytes?.buffer);
	//					const binary = new Decimal128(buff);
	//
	//					if (!updatedUsers.includes(user._id.toString())) {
	//						updatedUsers.push(user._id.toString());
	//					}
	//
	//					obj[key] = numbro(NumberInput.convert(NumberInput.someFuckingValueToInt(binary.toString()), user)).format({
	//						mantissa : 2,
	//						average  : false,
	//						output   : "number"
	//					}).toString();
	//
	//					console.log(`${user.username} has currupt data at ${builtPath}`, binary.toString(), numbroParse(binary.toString(), {output : "currency"}));
	//				} else if (typeof i === 'object' && (i !== undefined && i !== null)) {
	//					obj[key] = iterate(obj[key], usr, thisPath + '.' + key, builtPaths);
	//				}
	//			}
	//
	//			return obj;
	//		};
	//
	//		iterate(user, user, 'user', []);
	//
	//		if(updatedUsers.includes(user._id.toString())) {
	//			console.log(`Need to update ${user.username}`);
	//			const u          = hydrateModel(user, User);
	//			const dehydrated = dehydrateModel(u);
	//			await User.getCollection().updateOne({_id : u._id}, {$set : dehydrated});
	//		}
	//
	//	}

	//	ActivityEndedCron.start();

}

boot().then(() => Log.info('Le bot is running'));

