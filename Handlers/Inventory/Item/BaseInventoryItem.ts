import {Exclude} from "class-transformer";
import {Decimal128} from "mongodb";
import path from "path";
import {numbro} from "../../../Util/Formatter";

export class BaseInventoryItem {

	public name: string = '';

	public id: string = '';

	private _amount: Decimal128 = Decimal128.fromString('0');

	public slot: number = 0;

	itemImagePath() {
		return path.join(process.cwd(), 'Assets', 'Items', this.id + '.png');
	}

	@Exclude()
	get amount(): number {
		return numbro(this._amount.toString()).value();
	}

	set amount(amount: number) {
		this._amount = Decimal128.fromString(amount.toString());
	}

	incrementAmount(amount: number = 1) {
		this.amount = (this.amount + amount);
		return this;
	}

	decrementAmount(amount: number = 1) {
		this.amount = (this.amount - amount);
		return this;
	}

}
