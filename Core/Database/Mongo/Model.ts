import {classToPlainFromExist, Exclude} from "class-transformer";
import {ClassTransformOptions} from "class-transformer/types/interfaces";
import {Collection, FilterQuery, FindOneOptions, ObjectId, ReplaceOneOptions, UpdateQuery, WithoutProjection} from "mongodb";
import pluralize from 'pluralize';
import {container} from "tsyringe";
import {Container} from "winston";
import {ClassType} from "../index";
import {dehydrateModel, hydrateModel} from "../Serialization/Serializer";
import {QueryBuilder} from "./QueryBuilder";


export default class Model<M> {

	/**
	 * We'll store the result of the recent mongo request if there
	 * is one. This way we always have access to it, and can return
	 * generic true/false types of responses for some operations.
	 */
	@Exclude()
	private _recentMongoResponse: any = null;

	@Exclude()
	private readonly _queryBuilder: QueryBuilder<M>;

	constructor() {
		this._queryBuilder = new QueryBuilder<M>(this);
	}

	/**
	 * Access the underlying mongo collection for this model
	 */
	collection(): Collection<M> {
		return container.resolve<Collection<M>>(this.constructor.name + 'Model');
	}

	/**
	 * Get the query builder instance
	 */
	queryBuilder(): QueryBuilder<M> {
		return this._queryBuilder;
	}

	/**
	 * A helper method used to return a correct type...
	 * We're still getting used to generics.
	 *
	 * @private
	 */
	private modelInstance(): M {
		return this as unknown as M;
	}

	/**
	 * Get an instance of the mongo repository
	 */
	static getCollection<T extends Model<T>>(): Collection<T> {
		return container.resolve<Collection<T>>(this.name + 'Model');
	}

	/**
	 * Insert a new model into the collection
	 *
	 * @param entity
	 */
	static async insert(entity: Model<any>): Promise<Model<any>> {
		const c     = entity.collection();
		const plain = dehydrateModel(entity);

		const res = await c.insertOne(plain as any);

		(entity as any)._id = res.insertedId;
		(plain as any)._id  = res.insertedId;

		return hydrateModel(plain, entity.constructor as any);
	}

	/**
	 * Update this model
	 *
	 * @param attributes
	 * @param options
	 */
	async update(attributes: Partial<M>, options: ReplaceOneOptions = {}) {
		const plain = dehydrateModel({...this, ...attributes});

		let attributesToSet: any = {};

		attributesToSet['$currentDate']
			? (attributesToSet['$currentDate'].updatedAt = true)
			: attributesToSet['$currentDate'] = {updatedAt : true};

		if (plain['updatedAt']) {
			delete plain['updatedAt'];
		}

		attributesToSet.$set = plain;

		await this.collection().updateOne({_id : (this as any)._id}, attributesToSet);

		//		await this.collection().replaceOne({
		//			_id : (this as any)._id,
		//		}, plain as any, options);

		for (let attributesKey in attributes) {
			(this as any)[attributesKey] = attributes[attributesKey];
		}

		//		await this.refresh();
	}

	/**
	 * Query for a single model instance
	 *
	 * @param query
	 */
	static async findOne<T extends Model<T>>(query: FilterQuery<T | { _id: any }> = {}): Promise<T | null> {
		const model = await this.getCollection<T>().findOne<Object>(query as any);

		return hydrateModel(model, this as unknown as ClassType<T>);
	}

	/**
	 * Save any changes made to the model
	 *
	 * For ex:
	 * const user = await User.find(123);
	 * user.name = 'Sam';
	 * await user.save()
	 *
	 * @return this
	 */
	async save() {
		if (!(this as any)._id)
			await Model.insert(this);
		else
			await this.update({...(this as any)});

		return this;
	}

	/**
	 * Get all the properties from the database for this model
	 */
	async refresh() {
		const newVersion = await this.queryBuilder()
			.where({_id : (this as any)._id})
			.first();

		//		Object.keys(newVersion).forEach(key => this[key] = newVersion[key]);
		Object.assign(this, newVersion);
	}

	/**
	 * Delete the current model instance from the collection
	 */
	async delete() {
		await this.collection().deleteOne({_id : (this as any)._id});
	}

	/**
	 * calls mongodb.find function and returns its cursor with attached map function that hydrates results
	 * mongodb.find: http://mongodb.github.io/node-mongodb-native/3.1/api/Collection.html#find
	 */
	static async get<T extends Model<T>>(query?: FilterQuery<T | { _id: any }>, options?: WithoutProjection<FindOneOptions<T>>): Promise<T[]> {
		const cursor  = await this.getCollection<T>().find(query as any, options);
		const results = await cursor.toArray();

		return results.map(doc => hydrateModel(doc, this as unknown as ClassType<T>));
	}

	/**
	 * Count all the documents in the collection
	 */
	public static async count() {
		return this.where({}).count();
	}

	/**
	 * Get an instance of query builder, similar to using collection.find()
	 * But... our query builder returns a couple of helper methods, first(), get()
	 * {@see QueryBuilder}
	 *
	 * @param attributes
	 */
	static where<T extends Model<T>>(attributes: FilterQuery<T> | Partial<T>): QueryBuilder<T> {
		const model = (new this() as unknown as T);

		return model.queryBuilder().where<T>(attributes);
	}

	/**
	 * Allows us to efficiently load relationships
	 * Many to many or one to many
	 *
	 * @param refs
	 */
	static with<T>(...refs: (keyof T)[]) {
		const model: Model<T> = (new this() as Model<T>);

		return model.queryBuilder().with(...refs);
	}

	/**
	 * Find an item using it's id and return it as a model.
	 *
	 * @param id
	 */
	static find<T extends Model<T>>(id: string | ObjectId): Promise<T> {
		return this.findOne<T>({_id : new ObjectId(id)});
	}

	/**
	 * Basically an alias of the {@see QueryBuilder.orderByDesc()}
	 * that allows us to order and call get() or first()
	 *
	 * @param key
	 */
	static orderByDesc<T>(key: keyof T): QueryBuilder<T> {
		return new QueryBuilder<T>(new this()).orderByDesc(key);
	}

	/**
	 * Basically an alias of the {@see QueryBuilder.orderByAsc()}
	 * that allows us to order and call get() or first()
	 *
	 * @param key
	 */
	static orderByAsc<T>(key: keyof T): QueryBuilder<T> {
		return new QueryBuilder<T>(new this()).orderByAsc(key);
	}

	/**
	 * Create a new instance of this model and store it in the collection
	 *
	 * @TODO: Need to figure a solution for using generics with static methods.
	 *
	 * @param {Partial<M>} attributes
	 */
	static async create<T extends Model<T>>(attributes: Partial<T>): Promise<T> {
		const model = new this<T>();
		Object.assign(model, attributes);

		await this.insert(model);

		return await this.find(model['_id']);
	}

	/**
	 * Get an instance of the underlying mongo repository for this model
	 */
	static query<T extends Model<T>>() {
		//@ts-ignore
		return Container.get<Repository<M>>(this);
	}

	public mongoResponse(): any {
		return this._recentMongoResponse;
	}

	public setMongoResponse(response: any): any {
		this._recentMongoResponse = response;
	}

	/**
	 * Will return a correctly formatted name for the underlying mongo collection
	 */
	public collectionName(many: boolean = false) {
		return Model.formatNameForCollection(this.constructor.name, many);
	}

	static formatNameForCollection(str: string, many: boolean = false) {
		return String(pluralize(str, many ? 2 : 1)).toLowerCase();
	}

	/**
	 * When this model instance is returned in a
	 * response, we'll make sure to use classToPlain so
	 * that any @Exclude() properties etc are taken care of.
	 */
	toJSON() {
		return classToPlainFromExist(
			this,
			{},
			{
				enableCircularCheck : true,
				strategy            : "exposeAll",
			}
		);
	}

}


