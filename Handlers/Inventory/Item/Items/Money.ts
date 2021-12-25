import {ColorResolvable} from "discord.js";
import User from "../../../../Models/User/User";
import {formatMoney} from "../../../../Util/Formatter";
import {BaseInventoryItem} from "../BaseInventoryItem";

export class Money extends BaseInventoryItem {
	public name: string           = 'Money';
	public id: string             = 'money';
	public color: ColorResolvable = 'GOLD';


	public async redeem(user: User, channelId: string, addToInventory: boolean = false) {

		user.balanceManager().addToBalance(this.amount, 'redeemed via money item');
		await user.executeQueued();

		await this.sendRedeemedMessage(user, channelId, `${formatMoney(this.amount)} was added to your balance.`);

	}

}
