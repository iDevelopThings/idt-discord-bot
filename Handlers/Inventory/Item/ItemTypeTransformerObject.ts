import {CommonMysteryBox} from "./Items/CommonMysteryBox"
import {EpicMysteryBox} from "./Items/EpicMysteryBox"
import {RareMysteryBox} from "./Items/RareMysteryBox"
export const itemTypesTransformer = {
	keepDiscriminatorProperty : true,
	discriminator             : {
		property : 'id',
		subTypes : [{name : "common.mystery.box", value : CommonMysteryBox},
{name : "epic.mystery.box", value : EpicMysteryBox},
{name : "rare.mystery.box", value : RareMysteryBox}]
	}
}