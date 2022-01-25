import {Type} from "class-transformer";
import {BaseInventoryItem} from "./BaseInventoryItem";
import type {ItemTypes} from "./ItemTypes";
import {itemTypesTransformer} from "./ItemTypeTransformerObject";

export class ItemWithWeight {
	@Type(() => BaseInventoryItem, itemTypesTransformer())
	item: ItemTypes;
	@Type(() => Number)
	weight: number;

	static create(item: ItemTypes, weight: number): ItemWithWeight {
		const it  = new this();
		it.item   = item;
		it.weight = weight;

		return it;
	}
}
