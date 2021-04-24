import {MongoClientOptions} from "mongodb";

export interface MongoConnectionConfiguration {
	name: string;
	url: string;
	clientOptions: MongoClientOptions;
}

export default {
	mongo : {
		name          : process.env.DB_NAME,
		url           : process.env.DB_URL,
		clientOptions : {
			readPreference     : "primaryPreferred",
			useNewUrlParser    : true,
			useUnifiedTopology : true
		}
	} as MongoConnectionConfiguration,
};
