export default class Investment {

	static returnsFor(amountToInvest: number) {
		return Math.floor((amountToInvest / 10000) * 100);
	}

}
