import {CommonMysteryBox} from "./items/CommonMysteryBox"
import {EpicMysteryBox} from "./items/EpicMysteryBox"
import {RareMysteryBox} from "./items/RareMysteryBox"

export type Items = {
"common.mystery.box" : CommonMysteryBox,
"epic.mystery.box" : EpicMysteryBox,
"rare.mystery.box" : RareMysteryBox
};

export type ItemTypes = CommonMysteryBox
| EpicMysteryBox
| RareMysteryBox;

export type ItemIdentifiers = keyof Items;