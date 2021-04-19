import {TextChannel} from "discord.js";
import {setInterval} from "timers";
import {GamblingInstanceManager, GamblingInstanceType} from "./GamblingInstanceManager";

export enum GamblingStatus {
	NOT_STARTED = 'not started',
	STARTING    = 'started',
	ENDED       = 'ended'
}

export abstract class GamblingInstance {

	protected _tickColors = [
		0xffffcc, 0xffff66, 0xfedf00, 0xffae42,
	];

	protected _tickColorIndex = 0;

	protected _tickRate = 2000;

	/**
	 * The type of game that this instance is
	 *
	 * @type {GamblingInstanceType}
	 * @private
	 */
	protected _gameType: GamblingInstanceType;

	/**
	 * Since games(instances) can have multiple happening
	 * at once then they need a way to be identified...
	 *
	 * Since we create the gambling instance via the
	 * {@see GamblingInstanceManager.newGame}
	 * the id will be automatically set
	 *
	 * @type {string}
	 * @protected
	 */
	protected _instanceId: string = null;

	/**
	 * The current status of this instance
	 *
	 * @type {GamblingStatus}
	 * @private
	 */
	protected _status: GamblingStatus = GamblingStatus.NOT_STARTED;

	/**
	 * The instance starting timer
	 * Usually this gives people x seconds to join the game
	 *
	 * @type {NodeJS.Timeout}
	 * @protected
	 */
	protected _startTimer: NodeJS.Timeout = null;

	/**
	 * A method to call when the start timer ended
	 *
	 * @type {Function}
	 * @protected
	 */
	protected _onStartTimerEnded: Function = null;

	/**
	 * A method to call when the start timer has begun
	 *
	 * @type {Function}
	 * @protected
	 */
	protected _onStartingTimerStarted: Function = null;

	/**
	 * How long the starting timer should run for
	 *
	 * @type {number}
	 * @protected
	 */
	protected _startTimerLength = 30_000;

	/**
	 * When the starting timer has been started, we'll begin
	 * a countdown which will be displayed on the gambling message
	 * so that users know how long is left on the game and how long
	 * they have to join this game
	 *
	 * @type {number}
	 * @protected
	 */
	protected _startingTimeLeft: number = null;

	/**
	 * Every time the starting timer ticks, we can set a method to call
	 *
	 * @type {Function}
	 * @protected
	 */
	protected _onStartingTimeLeftTick: Function = null;

	/**
	 * The channel that this was started in.
	 *
	 * @type {TextChannel}
	 * @protected
	 */
	protected _channel: TextChannel = null;

	/**
	 * Start the timer to join the game
	 *
	 * @protected
	 */
	protected async startTimer() {
		if (this.isStarted()) {
			throw new Error('The starting timer has already been started.');
		}

		this._status = GamblingStatus.STARTING;

		// Set the current time to the start timer length, but in seconds
		this._startingTimeLeft = this.getCountdownTotalSeconds();

		// Every tick rate we'll decrease the seconds remaining time
		const countdown = setInterval(async () => {
			this._startingTimeLeft -= (this._tickRate / 1000);

			this._tickColorIndex++;
			if (this._tickColorIndex > (this._tickColors.length - 1)) {
				this._tickColorIndex = 0;
			}

			if (this._onStartingTimeLeftTick) {
				await this._onStartingTimeLeftTick(this._startingTimeLeft);
			}
		}, this._tickRate);

		this._startTimer = setTimeout(async () => {

			if (this._onStartTimerEnded) {
				await this._onStartTimerEnded();
			}

			this._startTimer       = null;
			this._startingTimeLeft = null;

			clearTimeout(countdown);
			this.cleanup();
		}, this._startTimerLength);

		if (this._onStartingTimerStarted) {
			await this._onStartingTimerStarted();
		}
	}

	isStarted() {
		if (this._status === GamblingStatus.STARTING) {
			return true;
		}

		if (this._status === GamblingStatus.ENDED) {
			return true;
		}

		if (this._startTimer) {
			return true;
		}

		return false;
	}

	/**
	 * Get the time left on the countdown and format it according to the situation
	 *
	 * @returns {string}
	 */
	getCountdownTimeLeft() {
		if (!this._startingTimeLeft && !this.isStarted()) {
			return 'Waiting to start...';
		}
		if (!this._startingTimeLeft && this.isStarted()) {
			return 'Ended.';
		}

		return this._startingTimeLeft + ' seconds';
	}

	getTickColor() {
		return this._tickColors[this._tickColorIndex];
	}

	/**
	 * Get the countdown total in seconds
	 *
	 * @returns {number}
	 */
	getCountdownTotalSeconds() {
		return this._startTimerLength / 1000;
	}

	/**
	 * SHOULD ONLY BE CALLED WHEN GAMBLING HAS FINISHED.
	 */
	cleanup() {
		GamblingInstanceManager.instanceIsFinished(this);
	}

	/**
	 * Set the channel this gamble was started in
	 *
	 * @param {TextChannel} channel
	 * @returns {this}
	 */
	setChannel(channel: TextChannel) {
		this._channel = channel;

		return this;
	}

	/**
	 * Set a method that is called when the {@see _startTimer} has ended.
	 *
	 * @param {Function} method
	 */
	setStartTimerEndedHandler(method: Function) {
		this._onStartTimerEnded = method;
	}

	/**
	 * Set a method that is called for each countdown timer tick
	 *
	 * @param {Function} method
	 */
	setStartingTimerTickHandler(method: Function) {
		this._onStartingTimeLeftTick = method;
	}

	/**
	 * Set a method that is called when the starting timer has started
	 *
	 * @param {Function} method
	 */
	setStartingTimerStartedHandler(method: Function) {
		this._onStartingTimerStarted = method;
	}

	/**
	 * Set the id of this instance
	 *
	 * @param {string} id
	 */
	setInstanceId(id: string) {
		if (this._instanceId !== null) return;

		this._instanceId = id;
	}

	getGameType() {
		return this._gameType;
	}

	public getInstanceId() {
		return this._instanceId;
	}
}
