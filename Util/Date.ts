import dayjs from "dayjs";
import duration, {Duration, DurationUnitsObjectType, DurationUnitType} from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(relativeTime);

export const createDuration = (amount: number, unit?: DurationUnitType): Duration => {
	return dayjs.duration(amount, unit);
};

export const timeRemaining = (date: string|Date) => {
	return dayjs(date).fromNow(true);
};

export {dayjs};
