import "reflect-metadata";
import {config} from 'dotenv';

config();
import './Util/Date';

import DatabaseManager from "./Core/Database/DatabaseManager";

const databaseManager = new DatabaseManager();


async function run() {
	await databaseManager.boot();



	debugger

}

run();
