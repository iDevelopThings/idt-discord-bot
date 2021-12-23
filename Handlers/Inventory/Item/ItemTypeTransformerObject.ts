import {CommonMysteryBox} from "./items/CommonMysteryBox"
import {EpicMysteryBox} from "./items/EpicMysteryBox"
import {RareMysteryBox} from "./items/RareMysteryBox"
export const itemTypesTransformer = {
	keepDiscriminatorProperty : true,
	discriminator             : {
		property : 'id',
		subTypes : [{name : "common.mystery.box", value : CommonMysteryBox},
{name : "epic.mystery.box", value : EpicMysteryBox},
{name : "rare.mystery.box", value : RareMysteryBox}]
	}
}