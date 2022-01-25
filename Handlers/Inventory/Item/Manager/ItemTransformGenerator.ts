import {Log} from "@envuso/common";
import fs from "fs";
import path from "path";
import {Item} from "./Item";

export class ItemTransformGenerator {

	public static generateTypescriptDefs() {
		let contentSections = [];

		if (!Item.itemClasses.length) {
			return;
		}

		const itemTypesConverters = [];
		const itemTypes           = [];
		const itemImports         = [];
		const items               = [];

		for (let itemClass of Item.itemClasses) {

			itemTypes.push(itemClass.ctor.name);

			items.push({
				key   : itemClass.instance.id,
				value : itemClass.ctor.name
			});

			const importPath = `./${itemClass.location.replace('.ts', '').replace('.js', '')}`
			itemTypesConverters.push(`{name : "${itemClass.instance.id}", value : import("${importPath}").then(i => i['${itemClass.ctor.name}'])}`);

			itemImports.push(`import {${itemClass.ctor.name}} from "${importPath}"`);
		}

		contentSections.push(itemImports.join('\n'));
		contentSections.push(`export type Items = {\n${items.map(i => `"${i.key}" : ${i.value}`).join(',\n')}\n};`);
		contentSections.push(`export type ItemTypes = ${itemTypes.join('\n| ')};`);
		contentSections.push(`export type ItemIdentifiers = keyof Items;`);

		const defPath = path.join(process.cwd(), 'Handlers', 'Inventory', 'Item', 'ItemTypes.d.ts');
		fs.writeFileSync(defPath, contentSections.join('\n\n'), {encoding : 'utf-8'});

		Log.info(`Writing ItemTypes.d.ts to ${defPath}`);

		const itemTypesContent = `

const transforms = [];

export const loadTransforms = async () => {
	const transformers = [
		${itemTypesConverters.join(',\n')}
		// {name : "common.mystery.box", value : Promise.resolve(import("./Items/CommonMysteryBox")).then(im => im['CommonMysteryBox'])},
		// {name : "epic.mystery.box", value : Promise.resolve(import("./Items/EpicMysteryBox")).then(im => im['EpicMysteryBox'])},
		// {name : "money", value : Promise.resolve(import("./Items/Money")).then(im => im['Money'])},
		// {name : "rare.mystery.box", value : Promise.resolve(import("./Items/RareMysteryBox")).then(im => im['RareMysteryBox'])}
	];

	for (let transformer of transformers) {
		const ctor = await transformer.value;
		transforms.push({name : transformer.name, value : ctor});
	}
};

export const itemTypesTransformer = () => {
	return {
		keepDiscriminatorProperty : true,
		discriminator             : {
			property : 'id',
			subTypes : transforms
		}
	};
};`;

		const itemTransformerPath = path.join(process.cwd(), 'Handlers', 'Inventory', 'Item', 'ItemTypeTransformerObject.ts');

		Log.info(`Writing ItemTypeTransformerObject.ts to ${itemTransformerPath}`);

		fs.writeFileSync(itemTransformerPath, itemTypesContent, {encoding : 'utf-8'});
	}

}
