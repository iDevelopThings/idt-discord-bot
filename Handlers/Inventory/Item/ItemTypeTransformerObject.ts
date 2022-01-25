

const transforms = [];

export const loadTransforms = async () => {
	const transformers = [
		{name : "common.mystery.box", value : import("./Items/CommonMysteryBox").then(i => i['CommonMysteryBox'])},
{name : "epic.mystery.box", value : import("./Items/EpicMysteryBox").then(i => i['EpicMysteryBox'])},
{name : "money", value : import("./Items/Money").then(i => i['Money'])},
{name : "rare.mystery.box", value : import("./Items/RareMysteryBox").then(i => i['RareMysteryBox'])}
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
};