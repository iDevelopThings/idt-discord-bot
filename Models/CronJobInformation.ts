import {ObjectId} from "mongodb";
import {id} from "../Core/Database/ModelDecorators";
import Model from "../Core/Database/Mongo/Model";

export default class CronJobInformation extends Model<CronJobInformation> {

	@id
	_id: ObjectId;

	handlerId: string;
	lastRun: Date | null;

}
