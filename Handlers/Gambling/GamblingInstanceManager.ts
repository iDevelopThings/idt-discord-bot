import {Log, Str} from "@envuso/common";
import {Gambling} from "./Gambling";
import {GamblingInstance} from "./GamblingInstance";

export enum GamblingInstanceType {
	RED_BLACK = 'RED_BLACK'
}

type GamblingClassType<T extends GamblingInstance> = T extends new (...args: any) => infer R ? R : any;

interface GamblingGameInformation<T extends GamblingInstance> {
	gamblingClass: GamblingClassType<T>;
	canBeMultiInstance: boolean
}

type GamblingInstanceClass<T extends GamblingInstance> = new () => T;

type GamblingInstanceInformation<T extends GamblingInstance> = {
	game: GamblingClassType<T>;
	id: string;
}

export class GamblingInstanceManager {

	static instances: Map<GamblingInstanceType, Map<string, GamblingInstanceInformation<any>>> = new Map();

	static gamblingGames: { [key: string]: GamblingGameInformation<any> } = {
		RED_BLACK : {
			gamblingClass      : Gambling,
			canBeMultiInstance : false
		}
	};


	static instance<T extends GamblingInstance>(type: GamblingInstanceType): T {
		const instances = this.instances.get(type) || new Map();
		const gameInfo  = this.gamblingGames[type];

		if (instances.size && !gameInfo.canBeMultiInstance) {
			const instance = Array.from(instances.values())[0];

			return instance.game as T;
		}

		return this.newGame<T>(type);
	}

	private static newGame<T extends GamblingInstance>(type: GamblingInstanceType): T {
		const gameRef = this.gameInfo<T>(type);

		const newGameInstance: GamblingInstanceInformation<typeof gameRef.gamblingClass> = {
			game : new gameRef.gamblingClass(),
			id   : Str.uniqueRandom(6)
		};

		newGameInstance.game.setInstanceId(newGameInstance.id);

		if (gameRef.canBeMultiInstance) {
			const instances = this.instances.get(type) || new Map();
			instances.set(newGameInstance.id, newGameInstance);

			this.instances.set(type, instances);

			return newGameInstance.game as T;
		}

		this.instances.set(type, new Map().set(newGameInstance.id, newGameInstance));

		return newGameInstance.game as T;
	}

	private static gameInfo<T extends GamblingInstance>(type: GamblingInstanceType): GamblingGameInformation<T> {
		return this.gamblingGames[type];
	}

	public static instanceIsFinished(gamblingInstance: GamblingInstance) {

		const instances = this.instances.get(gamblingInstance.getGameType());

		if (!instances) {
			Log.error('SOMEHOW THERE IS NO INSTANCE...');
			debugger;
			throw new Error('Somehow there is no instances for ' + gamblingInstance.getGameType());
		}

		const instance = instances.get(gamblingInstance.getInstanceId());

		if (!instance) {
			Log.error('SOMEHOW NO INSTANCE');
			debugger;
			throw new Error('Somehow the instance cannot be found...' + gamblingInstance.getGameType());
		}

		const info = this.gameInfo(gamblingInstance.getGameType());

		instances.delete(gamblingInstance.getInstanceId());

		this.instances.set(gamblingInstance.getGameType(), instances);
		console.log(this.instances.get(GamblingInstanceType.RED_BLACK));
	}
}
