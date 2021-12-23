import {formatMoney} from "../../../Util/Formatter";
import NumberInput from "../../../Util/NumberInput";
import {Dice} from "./Dice";

export class DiceRoll {

	private dieAmount: number      = 1;
	private dieFacesAmount: number = 6;
	private dies: Dice[]           = [];

	constructor(dieAmount: number = 1, dieFacesAmount: number = 6) {
		this.dieAmount = dieAmount;

		for (let i = 0; i < dieAmount; i++) {
			this.dies.push(new Dice(dieFacesAmount));
		}
	}

	roll() {
		for (let die of this.dies) {
			die.roll();
		}
	}

	values(): number[] {
		return this.dies.map(die => die.result());
	}

	valuesTotal(): number {
		return this.dies.reduce((carry, die) => die.result() + carry, 0);
	}

	getTotalSides(): number {
		return this.dies.reduce((carry, die) => die.faces() + carry, 0);
	}

	validateSideInput(sideInput: number): [boolean, string] {
		const totalSides   = this.getTotalSides();
		const sidesMessage = `Invalid side specified, valid sides are 1-${totalSides}`;

		if (sideInput <= 0) {
			return [false, sidesMessage];
		}
		if (sideInput > totalSides) {
			return [false, sidesMessage];
		}

		return [true, null];
	}

	getDie(): Dice {
		if (this.dieAmount > 1) {
			throw new Error('When using multiple dies, you cant use this method, it doesnt make sense to do so.');
		}

		return this.dies[0];
	}

	isWinningSide(sidePicked: number): boolean {
		return this.valuesTotal() === sidePicked;
	}

	getWinningsForInput(balanceInput: NumberInput, sidePicked: number): [number, string] {
		if (!this.isWinningSide(sidePicked)) {
			return [null, null];
		}

		const winnings = balanceInput.numbroValue().multiply(this.getTotalSides());

		return [
			winnings.value(),
			formatMoney(winnings.value())
		];
	}

	public getDieCount(): number {
		return this.dieAmount;
	}
}
