import {Log} from "@envuso/common";
import {Image, loadImage} from "canvas";
import {ClassConstructor} from "class-transformer";
import {sync} from "glob";
import path from "path";
import {BaseInventoryItem} from "../BaseInventoryItem";
import {ItemIdentifiers, Items, ItemTypes} from "../ItemTypes";

export type ItemClassListItem = {
	location: string,
	ctor: typeof BaseInventoryItem,
	instance: BaseInventoryItem
};

export class Item {

	/**
	 * A list of all item classes that are loaded
	 *
	 * @type {ItemClassListItem[]}
	 */
	public static itemClasses: ItemClassListItem[] = [];

	/**
	 * A map of item id -> item class constructor
	 *
	 * @type {Map<ItemIdentifiers, ItemTypes>}
	 */
	public static ctorMap: Map<ItemIdentifiers, ClassConstructor<ItemTypes>> = new Map();

	/**
	 * A map of item id -> item image instances
	 *
	 * @type {Map<string, Image>}
	 */
	public static itemImages: Map<ItemIdentifiers, Image> = new Map();

	/**
	 * Get a constructor instance of an item
	 *
	 * @param {ItemIdentifiers} id
	 * @returns {ClassConstructor<Items[T]>}
	 */
	public static getConstructor<T extends ItemIdentifiers>(id: ItemIdentifiers | string): ClassConstructor<Items[T]> {
		return this.ctorMap.get(id as ItemIdentifiers);
	}

	/**
	 * Get a new item instance
	 *
	 * This will allow us to access information like item name, image, weight etc.
	 *
	 * @param {ItemIdentifiers} id
	 * @returns {Items[T]}
	 */
	public static get<T extends ItemIdentifiers>(id: ItemIdentifiers | string): Items[T] {
		const inst = this.ctorMap.get(id as ItemIdentifiers);

		if (!inst) {
			return null;
		}

		return new inst();
	}

	public static getImage(id: string | ItemIdentifiers): Image {
		return this.itemImages.get(id as ItemIdentifiers);
	}

	/**
	 * Check if the string passed is a valid item id
	 *
	 * @param {string} item
	 * @returns {boolean}
	 */
	public static isItem(item: string): boolean {
		return this.ctorMap.has(item as ItemIdentifiers);
	}

	/**
	 * Load all of our item class instances and store them on the Item class instance.
	 *
	 * We'll then generate typescript definitions from these classes on the fly.
	 *
	 * @returns {Promise<void>}
	 */
	public static async loadItemClasses() {
		const basePath = path.join(__dirname, '..');

		const results = sync('Items/**/*{.ts,.js}', {cwd : basePath});


		for (let result of results) {
			const resultClass = await import(path.join(basePath, result));

			const itemClassExport = Object.keys(resultClass)[0] ?? null;
			if (!itemClassExport) {
				Log.warn(`Cannot load item class: ${result}, no export found. Available exports: `, Object.keys(resultClass));
				continue;
			}

			const itemClass = resultClass[itemClassExport];

			if (itemClass) {
				const inst = new itemClass();

				this.itemClasses.push({
					location : result,
					ctor     : itemClass,
					instance : inst
				});

				if (!this.ctorMap.has(inst.id)) {
					this.ctorMap.set(inst.id, itemClass);
				}

				if (!this.itemImages.has(inst.id)) {
					this.itemImages.set(inst.id, await loadImage(inst.itemImagePath()));
				}

				Log.success(`Successfully loaded item class: ${result}`);
			}
		}
	}
}
