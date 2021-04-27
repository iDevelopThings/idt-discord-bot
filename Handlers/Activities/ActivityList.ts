import User from "../../Models/User/User";
import RaidLocalCannabisFarm from "./Illegal/RaidLocalCannabisFarm";
import GrandamaGroceries from "./Legal/GrandamaGroceries";

export const activityList = [
	{
		name          : 'Raid local cannabis farm',
		value         : 'raid_local_cannabis',
		class         : RaidLocalCannabisFarm,
		color         : 'GREEN',
		classInstance : (user: User) => new RaidLocalCannabisFarm(
			user.activityManager().get('raid_local_cannabis')
		)
	},
	{
		name          : 'Help Grandama with Groceries',
		value         : 'grandma_groceries',
		class         : GrandamaGroceries,
		color         : 'BLUE',
		classInstance : (user: User) => new GrandamaGroceries(
			user.activityManager().get('grandma_groceries')
		)
	}
];
