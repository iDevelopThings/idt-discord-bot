import {CommonMysteryBox} from "./Items/CommonMysteryBox"
import {EpicMysteryBox} from "./Items/EpicMysteryBox"
import {RareMysteryBox} from "./Items/RareMysteryBox"

export type Items = {
"common.mystery.box" : CommonMysteryBox,
"epic.mystery.box" : EpicMysteryBox,
"rare.mystery.box" : RareMysteryBox
};

export type ItemTypes = CommonMysteryBox
| EpicMysteryBox
| RareMysteryBox;

export type ItemIdentifiers = keyof Items;