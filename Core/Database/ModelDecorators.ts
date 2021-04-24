import {classToPlain, plainToClass, Transform} from "class-transformer";
import {ObjectId} from "mongodb";
import pluralize from "pluralize";
import {ClassType, Nested, Ref} from "./index";

function addRef(name: string, ref: Ref, target: any) {
	const refs = Reflect.getMetadata('mongo:refs', target) || {};
	refs[name] = ref;
	Reflect.defineMetadata('mongo:refs', refs, target);
}

function pushToMetadata(metadataKey: string, values: any[], target: any) {
	const data: any[] = Reflect.getMetadata(metadataKey, target) || [];
	Reflect.defineMetadata(metadataKey, data.concat(values), target);
}

function isNotPrimitive(targetType: ClassType<any>, propertyKey: string) {
	if (targetType === ObjectId || targetType === String || targetType === Number || targetType === Boolean) {
		throw new Error(`property '${propertyKey}' cannot have nested type '${targetType}'`);
	}
}

export function nested(typeFunction: any) {
	return function (target: any, propertyKey: string) {
		const targetType = Reflect.getMetadata('design:type', target, propertyKey);
		isNotPrimitive(targetType, propertyKey);

//		Type(() => typeFunction)(target, propertyKey);

		Transform((val) => {
			if (!val.value) {
				return null;
			}

			if (targetType === Array) {
				return val.value.map(v => plainToClass(typeFunction, v))
			}

			return plainToClass(typeFunction, val.value)
		}, {toClassOnly : true})(target, propertyKey);

		Transform((val) => {
			if (!val.value) {
				return null;
			}
			if (targetType === Array) {
				return val.value.map(v => classToPlain(v))
			}

			return classToPlain(val.value)
		}, {toPlainOnly : true})(target, propertyKey);


		pushToMetadata('mongo:nested', [{name : propertyKey, typeFunction, array : targetType === Array} as Nested], target);
	}
}

export function ignore(target: any, propertyKey: any) {
	const ignores        = Reflect.getMetadata('mongo:ignore', target) || {};
	ignores[propertyKey] = true;
	Reflect.defineMetadata('mongo:ignore', ignores, target);
}

export function ref(modelReference: ClassType<any>) {
	return function (target: any, propertyKey: string) {
		const targetType = Reflect.getMetadata('design:type', target, propertyKey);
		isNotPrimitive(targetType, propertyKey);

		const isArray = targetType === Array;
		const refId   = pluralize(pluralize(propertyKey, 1) + (isArray ? 'Ids' : 'Id'), isArray ? 2 : 1);

		Reflect.defineMetadata('design:type', (isArray ? Array : ObjectId), target, refId);

		const refInfo = {
			_id       : refId,
			array     : isArray,
			modelName : modelReference.name
		}
		addRef(propertyKey, refInfo, target);

		Transform((val) => {
			if (!val.value) {
				return null;
			}

			if (targetType === Array) {
				return val.value.map(v => plainToClass(modelReference, v))
			}

			return plainToClass(modelReference, val.value)
		}, {toClassOnly : true})(target, propertyKey);

		Transform((val) => {
			if (!val.value) {
				return null;
			}
			if (targetType === Array) {
				return val.value.map(v => classToPlain(v))
			}

			return classToPlain(val.value)
		}, {toPlainOnly : true})(target, propertyKey);

	};
}

export function ids(target: any, propertyKey: string) {

	isNotPrimitive(target, propertyKey);

	Transform((val) => {
		if (!val.value) {
			return null;
		}

		return val.value.map(v => new ObjectId(v))
	}, {toClassOnly : true})(target, propertyKey);
	Transform((val) => {
		if (!val.value) {
			return null;
		}

		return val.value.map(v => v.toString())
	}, {toPlainOnly : true})(target, propertyKey);

}

export function id(target: any, propertyKey: string) {

	Transform(({value}) => new ObjectId(value), {toClassOnly : true})(target, propertyKey);
	Transform(({value}) => value.toString(), {toPlainOnly : true})(target, propertyKey);

}
