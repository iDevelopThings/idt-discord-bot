import {MongoClient} from "mongodb";

const database = new MongoClient(process.env.DB_URL, {
	readPreference     : "primaryPreferred",
	useNewUrlParser    : true,
	useUnifiedTopology : true
});

export const collection = <T>(name: string) => {
	return database.db(process.env.DB_NAME).collection<T>(name);
};

export {
	database
};
