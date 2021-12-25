import {CommonMysteryBox} from "./Items/CommonMysteryBox"
import {EpicMysteryBox} from "./Items/EpicMysteryBox"
import {Money} from "./Items/Money"
import {RareMysteryBox} from "./Items/RareMysteryBox"

export type Items = {
"common.mystery.box" : CommonMysteryBox,
"epic.mystery.box" : EpicMysteryBox,
"money" : Money,
"rare.mystery.box" : RareMysteryBox
};

export type ItemTypes = CommonMysteryBox
| EpicMysteryBox
| Money
| RareMysteryBox;

export type ItemIdentifiers = keyof Items;