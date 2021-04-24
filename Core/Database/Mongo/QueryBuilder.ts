import {Cursor, Decimal128, FilterQuery, FindOneOptions, UpdateManyOptions, UpdateQuery, WithoutProjection} from "mongodb";
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

	private _collectionFilter: object = null;

	private _collectionAggregation: object[] = [];

	private _collectionOrder: CollectionOrder | null = null;

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
	 * When a filter has been specified with where(). It will apply to
	 * {@see _collectionFilter} then when we make other calls, like
	 * .get(), .first() or .count() it will resolve the cursor
	 * or use it to make further mongodb calls.
	 *
	 * @private
	 */
	private resolveFilter() {
		const options = {} as WithoutProjection<FindOneOptions<T>>;

		if (this._collectionOrder && this._collectionOrder?.direction) {
			options.sort                            = {};
			options.sort[this._collectionOrder.key] = this._collectionOrder.direction;
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

	/**
	 * Get the first result in the mongo Cursor
	 */
	async first() {
		await this.resolveFilter();

		const result = await this._builderResult.limit(1).next();

		if (!result) return null;

		return hydrateModel(result, this._model.constructor as any);
	}

	/**
	 * Get all items from the collection that match the query
	 */
	async get() {
		const cursor = await this.resolveFilter();

		const results = await cursor.toArray();

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
	public async update(attributes: UpdateQuery<T> | Partial<T>, options?: UpdateManyOptions & { returnMongoResponse: boolean }) {

		attributes['$currentDate']
			? (attributes['$currentDate'].updatedAt = true)
			: attributes['$currentDate'] = {updatedAt : true};

		const response = await this._model.collection().updateMany(
			this._collectionFilter,
			attributes,
			options
		);

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

	public increment(field: string, amount: string, minAmount: string | number = 0) {
		const bulk = this._model.collection().initializeOrderedBulkOp();

		bulk.find(this._collectionFilter).updateOne({
			$inc : {
				[field] : Decimal128.fromString(amount)
			}
		});

		bulk.find(this._collectionFilter).updateOne({
			$max : {
				[field] : Decimal128.fromString(minAmount.toString())
			}
		});

		return bulk.execute();
	}

	public decrement(field: string, amount: string, minAmount: string | number = 0) {
		const bulk = this._model.collection().initializeOrderedBulkOp();

		bulk.find(this._collectionFilter).updateOne({
			$inc : {
				[field] : Decimal128.fromString(`-${amount}`)
			}
		});

		bulk.find(this._collectionFilter).updateOne({
			$max : {
				[field] : Decimal128.fromString(minAmount.toString())
			}
		});

		return bulk.execute();
	}

}
