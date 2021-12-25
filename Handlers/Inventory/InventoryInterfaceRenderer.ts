import Konva from "konva/cmj";
import User from "../../Models/User/User";
import {createCanvas} from "canvas";
import {formatNumber} from "../../Util/Formatter";
import {BaseInventoryItem} from "./Item/BaseInventoryItem";
import {Item} from "./Item/Manager/Item";
import UserInventoryManager from "./UserInventoryManager";

export class InventoryInterfaceRenderer {
	private grid: { spacing: number; x: number; y: number };
	private item: { itemPadding: number; itemSize: number };
	private dimensions: { balanceBarSection: { width: number; height: number }; width: number; height: number };
	private stage: Konva.Stage;
	private layer: Konva.Layer;
	private balancesBarGroup: Konva.Group;
	private inventorySlotsGroup: Konva.Group;
	private inventoryManager: UserInventoryManager;

	constructor(private user: User) {
		this.inventoryManager = this.user.inventoryManager();

		this.grid = {
			x       : 5,
			y       : 5,
			spacing : 20,
		};

		this.item = {
			itemSize    : 250,
			itemPadding : this.grid.spacing / 2
		};

		this.dimensions = {
			width  : (this.grid.x * (this.item.itemPadding + this.item.itemSize + this.item.itemPadding)),
			height : (this.grid.y * (this.item.itemPadding + this.item.itemSize + this.item.itemPadding)),

			balanceBarSection : {
				width  : 350,
				height : 80 + this.grid.spacing,
			}
		};

		this.stage = new Konva.Stage({
			//@ts-ignore
			container : createCanvas(this.dimensions.width + this.grid.spacing, this.dimensions.height + this.grid.spacing + this.dimensions.balanceBarSection.height),
			width     : this.dimensions.width + this.grid.spacing,
			height    : this.dimensions.height + this.grid.spacing + this.dimensions.balanceBarSection.height,
			listening : false,
		});


		this.layer = new Konva.Layer({});
		this.stage.add(this.layer);


		this.balancesBarGroup = new Konva.Group({
			x         : this.grid.spacing,
			y         : this.item.itemPadding,
			height    : this.dimensions.balanceBarSection.height,
			name      : 'balances-bar',
			listening : false,
		});

		this.inventorySlotsGroup = new Konva.Group({
			x         : this.grid.spacing,
			y         : this.balancesBarGroup.height(),
			width     : this.dimensions.width,
			height    : this.dimensions.height,
			name      : 'inventory-slots',
			listening : false,
		});

	}


	public static drawForUser(user: User): Konva.Stage {
		const renderer = new InventoryInterfaceRenderer(user);
		renderer.drawTopBar();
		renderer.drawInventory();

		return renderer.stage;
	}

	public static async drawAndGetBufferFor(user: User) {
		const stage = this.drawForUser(user);

		const frame: any     = await stage.toCanvas({
			pixelRatio : 1,
			mimeType   : "image/png",
			quality    : 0.5,
		});
		const buffer: Buffer = frame.toBuffer();

		return buffer;
	}

	private drawTopBar() {

		const balanceLabel    = new Konva.Text({
			x            : 10,
			y            : 10,
			width        : this.dimensions.balanceBarSection.width,
			height       : 16,
			fontSize     : 16,
			fill         : 'rgba(255,255,255,0.48)',
			fontStyle    : 'bold',
			fontVariant  : 'small-caps',
			text         : `BALANCE`,
			listening    : false,
			shadowOffset : {x : 2, y : 4},
			shadowColor  : 'rgba(0,0,0, 0.2)',
			shadowBlur   : 6,
		});
		const balanceText     = new Konva.Text({
			x             : 0,
			y             : balanceLabel.height() - 6,
			width         : this.dimensions.balanceBarSection.width,
			height        : this.dimensions.balanceBarSection.height,
			padding       : 10,
			fontSize      : 32,
			fontStyle     : 'bold',
			align         : 'center',
			verticalAlign : 'middle',
			fill          : '#fff',
			text          : this.user.balanceManager().getFormattedBalance('balance'),
			listening     : false,
			shadowOffset  : {x : 2, y : 4},
			shadowColor   : 'rgba(0,0,0, 0.2)',
			shadowBlur    : 6,
		});
		const balanceTextRect = new Konva.Rect({
			x            : 0,
			y            : 0,
			fill         : 'rgb(38,38,42)',
			width        : balanceText.width(),
			height       : balanceText.height(),
			stroke       : '#363639',
			strokeWidth  : 2,
			cornerRadius : 6,
			listening    : false,
		});


		const investedLabel           = new Konva.Text({
			x            : ((this.dimensions.width - this.grid.spacing) - this.dimensions.balanceBarSection.width) + 10,
			y            : 10,
			width        : this.dimensions.balanceBarSection.width,
			height       : 16,
			fontSize     : 16,
			fill         : 'rgba(255,255,255,0.48)',
			fontStyle    : 'bold',
			fontVariant  : 'small-caps',
			text         : `INVESTED`,
			listening    : false,
			shadowOffset : {x : 2, y : 4},
			shadowColor  : 'rgba(0,0,0, 0.2)',
			shadowBlur   : 6,
		});
		const investedBalanceText     = new Konva.Text({
			x             : (this.dimensions.width - this.grid.spacing) - this.dimensions.balanceBarSection.width,
			y             : investedLabel.height() - 6,
			width         : this.dimensions.balanceBarSection.width,
			height        : this.dimensions.balanceBarSection.height,
			padding       : 10,
			fontSize      : 32,
			align         : 'center',
			verticalAlign : 'middle',
			fill          : '#fff',
			text          : this.user.balanceManager().getFormattedBalance('invested'),
			listening     : false,
			shadowOffset  : {x : 2, y : 4},
			shadowColor   : 'rgba(0,0,0, 0.2)',
			shadowBlur    : 6,
		});
		const investedBalanceTextRect = new Konva.Rect({
			x            : investedBalanceText.x(),
			y            : 0,
			fill         : 'rgb(38,38,42)',
			width        : investedBalanceText.width(),
			height       : investedBalanceText.height(),
			stroke       : '#363639',
			strokeWidth  : 2,
			cornerRadius : 6,
			listening    : false,
		});

		this.balancesBarGroup.add(balanceTextRect);
		this.balancesBarGroup.add(investedBalanceTextRect);
		this.balancesBarGroup.add(balanceLabel);
		this.balancesBarGroup.add(balanceText);
		this.balancesBarGroup.add(investedLabel);
		this.balancesBarGroup.add(investedBalanceText);

		const centerSpace = {
			width : ((this.dimensions.balanceBarSection.width * 2) - (this.grid.spacing * 4)) - (this.grid.spacing * 2) + (this.grid.spacing / 2),
			x     : balanceTextRect.x() + balanceTextRect.width() + this.grid.spacing,
			y     : this.grid.spacing
		};

		const title = new Konva.Text({
			x             : centerSpace.x,
			y             : 0,
			width         : centerSpace.width,
			height        : this.dimensions.balanceBarSection.height,
			verticalAlign : 'middle',
			padding       : 10,
			fontSize      : 48,
			align         : 'center',
			fill          : '#fff',
			text          : `INVENTORY`,
			listening     : false,
			shadowOffset  : {x : 2, y : 4},
			shadowColor   : 'rgba(0,0,0, 0.8)',
			shadowBlur    : 12,
		});

		this.balancesBarGroup.add(title);

		this.balancesBarGroup.height(
			Math.max(investedBalanceTextRect.height(), balanceTextRect.height()) + this.grid.spacing
		);

		this.balancesBarGroup.cache();

		this.layer.add(this.balancesBarGroup);

		this.inventorySlotsGroup.y(this.balancesBarGroup.height() + this.grid.spacing);
	}

	private drawInventory() {
		let inventorySlot = 0;
		for (let y = 0; y < this.grid.y; y++) {
			for (let x = 0; x < this.grid.x; x++) {
				inventorySlot++;

				this.drawInventoryItemAtSlot(x, y, inventorySlot);
			}
		}

		this.layer.add(this.inventorySlotsGroup);
	}

	private drawInventoryItemAtSlot(x: number, y: number, inventorySlot: number) {

		const item = this.inventoryManager.getItemAtSlot(inventorySlot - 1);

		const position = {
			x : (x * (this.item.itemPadding + this.item.itemSize + this.item.itemPadding)),
			y : (y * (this.item.itemPadding + this.item.itemSize + this.item.itemPadding)),
		};

		const slotGroup = new Konva.Group({
			x         : position.x,
			y         : position.y,
			width     : this.item.itemSize,
			height    : this.item.itemSize,
			name      : 'slot_' + inventorySlot,
			listening : false,
		});

		const box = new Konva.Rect({
			x            : 0,
			y            : 0,
			width        : this.item.itemSize,
			height       : this.item.itemSize,
			fill         : '#26262a',
			stroke       : '#363639',
			strokeWidth  : 2,
			cornerRadius : 6,
			draggable    : false,
			shadowOffset : {x : 2, y : 4},
			shadowColor  : 'rgba(0,0,0, 0.2)',
			shadowBlur   : 6,
			listening    : false,
		});
		slotGroup.add(box);

		const itemText     = new Konva.Text({
			x             : 0,
			y             : 0,
			width         : this.item.itemSize,
			height        : 50,
			padding       : 6,
			fontSize      : 24,
			align         : 'center',
			verticalAlign : 'middle',
			fill          : '#fff',
			text          : item?.name ?? '',
			listening     : false,
		});
		const itemTextRect = new Konva.Rect({
			x            : 0,
			y            : 0,
			fill         : 'rgba(59,59,61,0.63)',
			width        : this.item.itemSize,
			height       : itemText.height(),
			stroke       : '#363639',
			strokeWidth  : 2,
			cornerRadius : [6, 6, 0, 0],
			listening    : false,
		});
		if (!item) {
			itemText.visible(false);
			itemTextRect.visible(false);
		}
		slotGroup.add(itemTextRect);
		slotGroup.add(itemText);

		const slotContentsDimensions = {
			x      : itemTextRect.x(),
			y      : itemTextRect.height() + 4,
			width  : slotGroup.width(),
			height : slotGroup.height() - itemTextRect.height(),
		};
		const slotContentsGroup      = new Konva.Group({
			...slotContentsDimensions,
			name      : 'slot_' + inventorySlot + '_content',
			listening : false,
		});

		if (item) {
			slotContentsGroup.add(this.drawItemImage(slotContentsGroup, item));

			const amountDimensions = {
				width  : slotContentsGroup.width() / 6,
				height : (slotContentsGroup.width() / 6) + (6 * 2),
			};

			const itemAmountText     = new Konva.Text({
				...amountDimensions,
				x             : slotContentsGroup.width() - (amountDimensions.width) + 2,
				y             : slotContentsGroup.height() - (amountDimensions.height) - 2,
				padding       : 6,
				fontSize      : 22,
				fontStyle     : 'bold',
				align         : 'center',
				verticalAlign : 'middle',
				fill          : '#fff',
				text          : formatNumber(item.amount),
				listening     : false,
			});
			const itemAmountTextRect = new Konva.Rect({
				x            : slotContentsGroup.width() - (amountDimensions.width) + 2,
				y            : slotContentsGroup.height() - (amountDimensions.height) - 2,
				fill         : 'rgba(59,59,61,0.63)',
				width        : itemAmountText.width(),
				height       : itemAmountText.height(),
				stroke       : '#363639',
				strokeWidth  : 2,
				cornerRadius : [6, 0, 6, 0],
				listening    : false,
			});

			slotContentsGroup.add(itemAmountTextRect);
			slotContentsGroup.add(itemAmountText);
		}

		slotGroup.add(slotContentsGroup);
		slotGroup.cache();

		this.inventorySlotsGroup.add(slotGroup);
	}

	private drawItemImage(slotContentsGroup: Konva.Group, item: BaseInventoryItem) {
		const itemImage = Item.getImage(item.id);

		const imgDimensions = this.getScaledImageCoordinates(
			slotContentsGroup.width() - 60,
			slotContentsGroup.height() - 60,
			itemImage.width,
			itemImage.height,
		);

		return new Konva.Image({
			x      : (slotContentsGroup.width() / 2) - (imgDimensions.newWidth / 2),
			y      : (slotContentsGroup.height() / 2) - (imgDimensions.newHeight / 2),
			height : imgDimensions.newHeight,
			width  : imgDimensions.newWidth,
			//@ts-ignore
			image : itemImage,
		});
	}

	private getScaledImageCoordinates(
		containerWidth,
		containerHeight,
		width,
		height,
	) {
		const widthRatio  = (containerWidth) / width,
		      heightRatio = (containerHeight) / height;
		const bestRatio   = Math.min(widthRatio, heightRatio);
		const newWidth    = width * bestRatio,
		      newHeight   = height * bestRatio;
		return {newWidth, newHeight};
	}
}
