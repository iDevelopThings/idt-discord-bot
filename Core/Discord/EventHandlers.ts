import {Log} from "@envuso/common";
import path from "path";
import BaseEventHandler from "../../EventHandlers/BaseEventHandler";
import {ClientEvents} from "discord.js";

export const boundEvents: (keyof ClientEvents)[] = [];

function loadDiscordEventHandlers() {
	const eventHandlers: { [key: string]: any } = require('require-all')({
		dirname   : path.join(__dirname, '..', '..', 'EventHandlers'),
		recursive : true,
		filter    : /^(.+)\.(j|t)s$/,
		resolve   : function (Handler) {
			return new Handler.default();
		}
	});

	for (let eventHandlersKey in eventHandlers) {

		if (eventHandlersKey === 'BaseEventHandler') continue;

		const handler = eventHandlers[eventHandlersKey];

		if (!(handler instanceof BaseEventHandler)) {
			Log.error('Event handler class ' + eventHandlersKey + ' does not event BaseEventHandler');
			continue;
		}

		handler.bindListener();

		boundEvents.push(handler.getEventName());

	}

}

export {
	loadDiscordEventHandlers
};
