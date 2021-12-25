const random     = require('random');
const seedrandom = require('seedrandom');
import {Chance} from 'chance';


export const getChanceInstance = (): Chance.Chance => {
	return new Chance(require('crypto').randomBytes(10).toString('hex'));
};


export const getRandomInstance = () => {
	random.use(seedrandom(
		require('crypto').randomBytes(10).toString('hex')
	));

	return random;
};

export const getRandomInt = (min: number, max: number) => {
	return getRandomInstance().int(min, max);
};

export const getRandomPercentage = (min: number, max: number) => {
	return getRandomInstance().float(min, max) / 100;
};

