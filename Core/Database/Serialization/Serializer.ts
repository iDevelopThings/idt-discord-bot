import {classToPlain, plainToClass} from "class-transformer";
import {ObjectId} from 'mongodb';
import {ClassType, Ref} from "../index";

export function dehydrateModel<T>(entity: T): Object {
	if (!entity)
		return entity;

	const refs = Reflect.getMetadata('mongo:refs', entity) || {};

	for (let name in refs) {
		const ref: Ref     = refs[name];
		const reffedEntity = entity[name];

		if (!reffedEntity) {
			continue;
		}

		if (ref.array) {
			entity[ref._id] = reffedEntity.map(
				(e: any) => new ObjectId(e._id)
			);

			continue;
		}

		entity[ref._id] = new ObjectId(reffedEntity._id);
	}

	const plain: any = classToPlain(entity, {
		enableCircularCheck : true,
		excludePrefixes : ['_']
	});
//	const plain: any = Object.assign({}, entity);

	for (let name in refs) {
		delete plain[name];
	}


	const nested = Reflect.getMetadata('mongo:nested', entity) || [];
	for (let {name, array} of nested) {
		if (plain[name]) {
			if (!array) {
				plain[name] = dehydrateModel(plain[name]);
			} else {
				plain[name] = plain[name].map((e: any) => dehydrateModel(e));
			}
		}
	}

	const ignores = Reflect.getMetadata('mongo:ignore', entity) || {};
	for (const name in ignores) {
		delete plain[name];
	}

	return plain;
}

export function hydrateModel<T>(plain: Object | null, type : ClassType<T>) {
	return plain ? plainToClass<T, Object>(type, plain) : null;
}
