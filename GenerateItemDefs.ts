import {Log} from "@envuso/common";
import {exec} from "child_process";
import {Item} from "./Handlers/Inventory/Item/Manager/Item";
import {ItemTransformGenerator} from "./Handlers/Inventory/Item/Manager/ItemTransformGenerator";
import "reflect-metadata";
import {config} from 'dotenv';

config();

const runCmd = (cmd: string) => {
	return new Promise(((resolve, reject) => {
		const child = exec(cmd, {cwd : process.cwd()});
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
		child.on('exit', function () {
			resolve(true);
		});
		child.on('error', function (err: Error) {
			reject(err);
		});
	}));
};

const generate = async () => {
	await Item.loadItemClasses();
	ItemTransformGenerator.generateTypescriptDefs();
	Log.success(`All done... types generated successfully.... re-running tsc`);

	await runCmd(`yarn build`);
	Log.success(`All done with build... restarting supervisor process.!`);
	await runCmd(`sudo supervisorctl restart daemon-637095:daemon-637095_00`);
};


generate()
	.then(() => Log.success(`All done!`))
	.catch(error => console.error(error));
