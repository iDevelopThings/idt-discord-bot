import "reflect-metadata";
import {createCanvas, loadImage} from "canvas";
import {config} from 'dotenv';

config();
import './Util/Date';
import * as fs from "fs";
import path from "path";

const Konva = require('konva/cmj').default;

function getScaledImageCoordinates(
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

async function run() {

	const grid = {
		x       : 5,
		y       : 5,
		spacing : 20,
	};

	const item = {
		itemSize    : 250,
		itemPadding : grid.spacing / 2
	};

	const dimensions = {
		width  : (grid.x * (item.itemPadding + item.itemSize + item.itemPadding)),
		height : (grid.y * (item.itemPadding + item.itemSize + item.itemPadding)),

		balanceBarSection : {
			width  : 350,
			height : 50 + grid.spacing,
		}
	};

	const stage = new Konva.Stage({
		container : createCanvas(dimensions.width + grid.spacing, dimensions.height + grid.spacing + dimensions.balanceBarSection.height),
		width     : dimensions.width + grid.spacing,
		height    : dimensions.height + grid.spacing + dimensions.balanceBarSection.height,
		listening : false,
	});

	const layer = new Konva.Layer({});
	stage.add(layer);

	const balancesBarGroup = new Konva.Group({
		x         : grid.spacing,
		y         : item.itemPadding,
		height    : dimensions.balanceBarSection.height,
		name      : 'balances-bar',
		listening : false,
	});

	const balanceText     = new Konva.Text({
		x             : 0,
		y             : 0,
		width         : dimensions.balanceBarSection.width,
		height        : dimensions.balanceBarSection.height,
		padding       : 10,
		fontSize      : 32,
		align         : 'center',
		verticalAlign : 'middle',
		fill          : '#fff',
		text          : `Balance: $1,200,400`,
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

	const investedBalanceText     = new Konva.Text({
		x             : (dimensions.width - grid.spacing) - dimensions.balanceBarSection.width,
		y             : 0,
		width         : dimensions.balanceBarSection.width,
		height        : dimensions.balanceBarSection.height,
		padding       : 10,
		fontSize      : 32,
		align         : 'center',
		verticalAlign : 'middle',
		fill          : '#fff',
		text          : `Invested: $1,200,400`,
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

	balancesBarGroup.add(balanceTextRect);
	balancesBarGroup.add(investedBalanceTextRect);
	balancesBarGroup.add(balanceText);
	balancesBarGroup.add(investedBalanceText);

	const centerSpace = {
		width : ((dimensions.balanceBarSection.width * 2) - (grid.spacing * 4)) - (grid.spacing * 2) + (grid.spacing / 2),
		x     : balanceTextRect.x() + balanceTextRect.width() + grid.spacing,
		y     : grid.spacing
	};

	const title = new Konva.Text({
		x             : centerSpace.x,
		y             : 0,
		width         : centerSpace.width,
		height        : dimensions.balanceBarSection.height,
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
	//	const titleTextRect = new Konva.Rect({
	//		x            : centerSpace.x,
	//		y            : 0,
	//		fill         : 'rgb(38,38,42)',
	//		width        : title.width(),
	//		height       : title.height(),
	//		stroke       : '#363639',
	//		strokeWidth  : 2,
	//		cornerRadius : 6,
	//		listening    : false,
	//	});
	//	balancesBarGroup.add(titleTextRect);
	balancesBarGroup.add(title);

	balancesBarGroup.height(
		Math.max(investedBalanceTextRect.height(), balanceTextRect.height()) + grid.spacing
	);

	balancesBarGroup.cache();
	layer.add(balancesBarGroup);

	const inventorySlotsGroup = new Konva.Group({
		x         : grid.spacing,
		y         : balancesBarGroup.height(),
		width     : dimensions.width,
		height    : dimensions.height,
		name      : 'inventory-slots',
		listening : false,
	});

	let inventorySlot = 0;
	for (let y = 0; y < grid.y; y++) {
		for (let x = 0; x < grid.x; x++) {
			inventorySlot++;

			const position = {
				x : (x * (item.itemPadding + item.itemSize + item.itemPadding)),
				y : (y * (item.itemPadding + item.itemSize + item.itemPadding)),
			};

			const slotGroup = new Konva.Group({
				x         : position.x,
				y         : position.y,
				width     : item.itemSize,
				height    : item.itemSize,
				name      : 'slot_' + inventorySlot,
				listening : false,
			});

			const box = new Konva.Rect({
				x            : 0,
				y            : 0,
				width        : item.itemSize,
				height       : item.itemSize,
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
				width         : item.itemSize,
				height        : 50,
				padding       : 6,
				fontSize      : 24,
				align         : 'center',
				verticalAlign : 'middle',
				fill          : '#fff',
				text          : `Slot: ${inventorySlot}`,
				listening     : false,
			});
			const itemTextRect = new Konva.Rect({
				x            : 0,
				y            : 0,
				fill         : 'rgba(59,59,61,0.63)',
				width        : item.itemSize,
				height       : itemText.height(),
				stroke       : '#363639',
				strokeWidth  : 2,
				cornerRadius : [6, 6, 0, 0],
				listening    : false,
			});


			const imagePath = path.join(__dirname, 'Assets', 'Items', 'epic_mystery_box.png');
			const imageUrl  = fs.readFileSync(imagePath, {encoding : 'base64url'});

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
			const itemImage              = await loadImage(imagePath);

			const imgDimensions = getScaledImageCoordinates(
				slotContentsDimensions.width - 60,
				slotContentsDimensions.height - 60,
				itemImage.width,
				itemImage.height,
			);

			const img = new Konva.Image({
				x      : (slotContentsDimensions.width / 2) - (imgDimensions.newWidth / 2),
				y      : (slotContentsDimensions.height / 2) - (imgDimensions.newHeight / 2),
				height : imgDimensions.newHeight,
				width  : imgDimensions.newWidth,
				image  : itemImage,
			});
			slotContentsGroup.add(img);
			slotGroup.add(slotContentsGroup);

			slotGroup.cache();

			inventorySlotsGroup.add(slotGroup);
		}
	}

	layer.add(inventorySlotsGroup);

	const json = stage.toObject();

	console.log(json);


	const frame: any     = await stage.toCanvas({
		pixelRatio : 1,
		mimeType   : "image/png",
		quality    : 0.5,
	});
	const buffer: Buffer = frame.toBuffer();

	fs.writeFile('inventory.png', buffer, (err) => {
		if (err) return console.error(err);
		console.log('image saved');
	});
}

run().catch(error => console.error(error));
