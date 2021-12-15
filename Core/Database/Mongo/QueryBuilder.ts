import {Cursor, Decimal128, FilterQuery, FindOneOptions, PushOperator, UpdateManyOptions, UpdateQuery, WithoutProjection} from "mongodb";
import {ClassType, Ref} from "../index";
import {hydrateModel} from "../Serialization/Serializer";
import Model from "./Model";

interface CollectionOrder {
	direction: 1 | -1,
	key: string,
}

export class QueryBuilder<T> {

	/**
	 * When we call any internal mongo methods to query a collection
	 * we'll store it's instance here so that we can use chaining.
	 *
	 * @private
	 */
	private _builderResult: Cursor<T>;

	private _model: Model<T>;

	private _collectionFilter: object = {};

	// $max
	private _collectionMax: object = {};

	// $set
	private _collectionSet: object = {};

	// $unset
	private _collectionUnset: object = {};

	// $inc
	private _collectionIncrement: object = {};

	// $push
	private _collectionPush: Map<string, object[]> = new Map<string, object[]>();

	private _collectionAggregation: object[] = [];

	private _collectionOrder: CollectionOrder | null = null;

	private _limit: number = null;

	private _options: WithoutProjection<FindOneOptions<T>> = {};

	constructor(model: Model<T>) {
		this._model = model;
	}

	/**
	 * Similar to using collection.find()
	 *
	 * @param attributes
	 */
	public where<M>(attributes: FilterQuery<M | T> | Partial<M | T>): QueryBuilder<T> {
		this._collectionFilter = attributes;

		return this;
	}

	/**
	 * Allows us to specify any model refs to load in this query
	 *
	 * @param refsToLoad
	 */
	public with(...refsToLoad: (keyof T)[]): QueryBuilder<T> {

		const refs = Reflect.getMetadata('mongo:refs', this._model) || {};

		for (let ref of refsToLoad) {

			const refInfo: Ref = refs[ref];

			//			if (!refInfo) {
			//				throw new InvalidRefSpecified(this._model.constructor.name, String(ref));
			//			}

			this._collectionAggregation.push({
				$lookup : {
					from         : Model.formatNameForCollection(refInfo.modelName, true),
					localField   : refInfo._id,
					foreignField : '_id',
					as           : ref
				}
			});

			if (!refInfo.array) {
				this._collectionAggregation.push({
					$unwind : {
						path                       : '$' + Model.formatNameForCollection(refInfo.modelName, refInfo.array),
						preserveNullAndEmptyArrays : true
					}
				});
			}


		}

		return this;
	}

	/**
	 * Allows us to specify an order of descending, which is applied to the cursor
	 *
	 * @param key
	 */
	orderByDesc(key: keyof T | string) {
		this._collectionOrder = {
			key       : String(key),
			direction : -1
		};

		return this;
	}

	/**
	 * Allows us to specify an order of ascending, which is applied to the cursor
	 *
	 * @param key
	 */
	orderByAsc(key: keyof T | string) {
		this._collectionOrder = {
			key       : String(key),
			direction : 1
		};

		return this;
	}

	/**
	 * Add values to be $set
	 *
	 * @param {Partial<T>} values
	 * @returns {this<T>}
	 */
	set(values: Partial<T>) {
		this._collectionSet = {...this._collectionSet, ...values};

		return this;
	}

	/**
	 * Add a key to be removed from the document
	 *
	 * @returns {this<T>}
	 * @param key
	 */
	unset(key: string) {
		this._collectionUnset = {...this._collectionUnset, ...{[key] : ""}};

		return this;
	}

	/**
	 * key/value to use with $max
	 *
	 * @param {string} key
	 * @param value
	 * @returns {this<T>}
	 */
	max(key: string, value: any) {
		this._collectionMax = {...this._collectionMax, ...{[key] : value}};

		return this;
	}

	/**
	 * Allows us to add a $inc operation which is applied to the update call.
	 *
	 * @param {string} key
	 * @param {string} amount
	 * @return {this<T>}
	 */
	increment(key: string, amount: string) {
		this._collectionIncrement[key] = Decimal128.fromString(amount.toString());

		return this;
	}

	/**
	 * Allows us to add a $inc operation which is applied to the update call.
	 * Automatically inverts the amount passed in so it decrements the value.
	 *
	 * @param {string} key
	 * @param {string} amount
	 * @return {this<T>}
	 */
	decrement(key: string, amount: string) {
		this._collectionIncrement[key] = Decimal128.fromString(`-${amount.toString()}`);

		return this;
	}

	/**
	 * Used for the $push operation... Not sure what else to explain 😅
	 *
	 * @param {string} key
	 * @param {T} obj
	 * @return {this<T>}
	 */
	push<T>(key: string, obj: T) {
		if (!this._collectionPush.has(key)) {
			this._collectionPush.set(key, []);
		}

		this._collectionPush.get(key).push(obj as any);

		return this;
	}

	setOptions(options: WithoutProjection<FindOneOptions<T>>) {
		this._options = options;
		return this;
	}

	/**
	 * When a filter has been specified with where(). It will apply to
	 * {@see _collectionFilter} then when we make other calls, like
	 * .get(), .first() or .count() it will resolve the cursor
	 * or use it to make further mongodb calls.
	 *
	 * @private
	 */
	private resolveFilter() {
		const options = this._options;

		if (this._collectionOrder && this._collectionOrder?.direction) {
			options.sort                            = {};
			options.sort[this._collectionOrder.key] = this._collectionOrder.direction;
		}

		if (this._limit !== null) {
			options.limit = this._limit;
		}

		if (this._collectionAggregation?.length) {
			const aggregation = [
				{$match : this._collectionFilter},
				...this._collectionAggregation
			];

			this._builderResult = this._model
				.collection()
				.aggregate<T>(aggregation);

			return this._builderResult;
		}

		this._builderResult = this._model
			.collection()
			.find(this._collectionFilter, options);

		return this._builderResult;
	}

	limit(limit: number) {
		this._limit = limit;

		return this;
	}

	/**
	 * Get the first result in the mongo Cursor
	 */
	async first() {
		await this.resolveFilter();

		const result = await this._builderResult.limit(1).next();

		this.reset();

		if (!result) return null;

		return hydrateModel(result, this._model.constructor as any);
	}

	/**
	 * Get all items from the collection that match the query
	 */
	async get() {
		const cursor  = await this.resolveFilter();
		const results = await cursor.toArray();

		this.reset();

		return results.map(
			result => hydrateModel(result, this._model.constructor as unknown as ClassType<T>)
		);
	}

	/**
	 * Update many items in the collection, will use the filter specified by .where()
	 * You can specify {returnMongoResponse : true} in the options to return the mongo result
	 * of this operation, otherwise, this method will return true/false if it succeeded or failed.
	 *
	 * @param attributes
	 * @param options
	 * @return boolean | UpdateWriteOpResult
	 */
	public async update(attributes: UpdateQuery<T> | Partial<T> = {}, options?: UpdateManyOptions & { returnMongoResponse: boolean }) {
		const query = this.buildUpdateQuery(attributes);

		if (query === null) {
			return false;
		}

		const response = await this._model.collection().updateMany(
			this._collectionFilter,
			query,
			options
		);

		this.reset();

		if (options?.returnMongoResponse) {
			return response;
		}

		this._model.setMongoResponse(response);

		return !!response?.result?.ok;
	}

	/**
	 * Get an instance of the underlying mongo cursor
	 */
	async cursor(): Promise<Cursor<T>> {
		return this._builderResult;
	}

	/**
	 * Returns the count of items, filters if one was specified with .where()
	 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#estimatedDocumentCount
	 * http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#countDocuments
	 * @returns integer
	 */
	public count() {
		return this._model.collection().countDocuments(this._collectionFilter);
	}

	/*
	 Private Shit
	 */

	/**
	 * Build an update operation based on the varies calls to increment/push/update etc...
	 *
	 * @param {UpdateQuery<T>} query
	 * @return {UpdateQuery<T>>}
	 * @private
	 */
	private buildUpdateQuery(query: UpdateQuery<T>) {
		const operation: UpdateQuery<T> = {
			$max   : Object.assign({}, this._collectionMax, query.$max),
			$set   : Object.assign({}, this._collectionSet, query.$set),
			$unset : Object.assign({}, this._collectionUnset, query.$unset),
			$inc   : Object.assign({}, this._collectionIncrement, query.$inc),
			$push  : this.buildPushOperation(query.$push)
		};

		// Cleanup the query a little
		for (const key in operation) {
			if (operation[key] === undefined || operation[key] === null) {
				delete operation[key];
				continue;
			}

			if (Array.isArray(operation[key]) && operation[key].length === 0) {
				delete operation[key];
			}

			if (typeof operation[key] === 'object' && Object.keys(operation[key]).length === 0) {
				delete operation[key];
			}
		}

		if (Object.keys(operation).length === 0) {
			return null;
		}

		operation['$currentDate'] = Object.assign({}, query.$currentDate, {updatedAt : true});

		return operation;
	}

	/**
	 * Combines $push operation from the update call with the individual calls o `QueryBuilder.push`
	 *
	 * @param {PushOperator<T>} push
	 * @return {{}}
	 * @private
	 */
	private buildPushOperation(push: PushOperator<T> = {}) {
		const op = {};

		for (const key in push) {
			op[key] = push[key];
		}

		for (const [key, obj] of this._collectionPush) {
			if (obj.length === 0) {
				continue;
			}

			if (op.hasOwnProperty(key)) {
				if (!op[key].hasOwnProperty('$each')) {
					op[key] = {
						$each : [op[key]]
					};
				}

				op[key].$each.push(...obj);
				continue;
			}

			op[key] = {
				$each : obj
			};
		}

		return op;
	}

	private reset() {
		this._collectionFilter    = {};
		this._collectionSet       = {};
		this._collectionUnset     = {};
		this._collectionIncrement = {};
		this._collectionMax       = {};
		this._collectionPush.clear();
		this._collectionAggregation = [];
		this._collectionOrder       = null;
		this._limit                 = null;
		this._options               = {};
	}
}
