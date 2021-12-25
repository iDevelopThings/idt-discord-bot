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

}
