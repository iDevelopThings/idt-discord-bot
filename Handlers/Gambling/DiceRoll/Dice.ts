import {getRandomInt} from "../../../Util/Random";

export class Dice {
	private _faces: number;
	private _result: number = null;

	constructor(faces: number = 6) {
		this._faces = faces;
	}

	public roll() {
		if (this._result !== null) {
			throw new Error('Dice has already been rolled. Create a new instance to roll again.');
		}

		this._result = getRandomInt(1, this._faces);
	}

	public faces(): number {
		return this._faces;
	}

	public result(): number {
		return this._result;
	}
}
