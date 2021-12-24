import {Log} from "@envuso/common";
import {Image, loadImage} from "canvas";
import * as fs from "fs";
import {sync} from "glob";
import path from "path";
import {BaseInventoryItem} from "./BaseInventoryItem";
import {ItemIdentifiers, Items} from "./ItemTypes";


export class ItemTransformer {

	public static itemClasses: {
		location: string,
		ctor: typeof BaseInventoryItem,
		instance: BaseInventoryItem
	}[] = [];

	public static ctorMap: Map<string, typeof BaseInventoryItem> = new Map();
	public static itemImages: Map<string, Image>                 = new Map();

	public static async loadItemClasses() {
		const results = sync('Items/**/*{.ts,.js}', {
			cwd : __dirname
		});

		const classes = [];
		for (let result of results) {
			const resultClass = await import(path.join(__dirname, result));

			const itemClassExport = Object.keys(resultClass)[0] ?? null;
			if (!itemClassExport) {
				Log.warn(`Cannot load item class: ${result}, no export found. Available exports: `, Object.keys(resultClass));
				continue;
			}

			const itemClass = resultClass[itemClassExport];

			if (itemClass) {
				const inst = new itemClass();
				classes.push({
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

		this.itemClasses = [...classes];

		this.generateTypescriptDefs();
	}

	public static getItemCtor<T extends typeof BaseInventoryItem>(id: string | ItemIdentifiers): T {
		return this.ctorMap.get(id) as T;
	}

	public static getItemInstance<T extends ItemIdentifiers>(id: string | ItemIdentifiers): Items[T] {
		const inst = this.ctorMap.get(id);

		if (!inst) {
			return null;
		}

		return new inst();
	}

	public static generateTypescriptDefs() {
		let contentSections = [];

		if (!this.itemClasses.length) {
			return;
		}

		const itemTypesConverters = [];
		const itemTypes           = [];
		const itemImports         = [];
		const items               = [];

		for (let itemClass of this.itemClasses) {

			itemTypes.push(itemClass.ctor.name);

			items.push({
				key   : itemClass.instance.id,
				value : itemClass.ctor.name
			});

			itemTypesConverters.push(`{name : "${itemClass.instance.id}", value : ${itemClass.ctor.name}}`);

			itemImports.push(`import {${itemClass.ctor.name}} from "./${itemClass.location.replace('.ts', '').replace('.js', '')}"`);
		}

		contentSections.push(itemImports.join('\n'));
		contentSections.push(`export type Items = {\n${items.map(i => `"${i.key}" : ${i.value}`).join(',\n')}\n};`);
		contentSections.push(`export type ItemTypes = ${itemTypes.join('\n| ')};`);
		contentSections.push(`export type ItemIdentifiers = keyof Items;`);

		fs.writeFileSync(path.join(__dirname, 'ItemTypes.d.ts'), contentSections.join('\n\n'), {encoding : 'utf-8'});


		const itemTypesContent = `${itemImports.join('\n')}\nexport const itemTypesTransformer = {
	keepDiscriminatorProperty : true,
	discriminator             : {
		property : 'id',
		subTypes : [${itemTypesConverters.join(',\n')}]
	}
}`;

		fs.writeFileSync(path.join(__dirname, 'ItemTypeTransformerObject.ts'), itemTypesContent, {encoding : 'utf-8'});
	}

	public static isItem(item: string) {
		return this.ctorMap.has(item);
	}
}
