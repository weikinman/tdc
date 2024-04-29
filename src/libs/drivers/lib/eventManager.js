import fastDeepEqual from  'fast-deep-equal';
class Listener{
	type;
	handlers;
	constructor(type){
		this.type = '';
		this.handlers = []
	}
}
class EventEmitter{
	listenders_ = {}
	on(type,handler) {
		if(!this.listenders_[type]){
			this.listenders_[type] = new Listener(type);
		}
		this.listenders_[type].handler.push(handler);
	}
	emit(type,object = null) {
		if(this.listenders_[type]){
			this.listenders_[type].handlers.forEach(handler=>{
				handler && handler(this,object);
			});
		}
	}
	removeListener(type) {
		if(this.listenders_[type]){
			this.listenders_[type] = new Listener(type);
		}
	}
	listeners(type){
		if(this.listenders_[type]){
			return this.listenders_[type].handlers;
		}
	}
	once(type,handler) {
		if(!this.listenders_[type]){
			this.listenders_[type] = new Listener(type);
		}
		this.listenders_[type].handler.push(function(e,object) {
			
			handler(e,object);

			this.removeListener(type);
		});
	}
}
export const EventName = {
	ResourceCreate : 'resourceCreate',
	ResourceChange : 'resourceChange',
	SettingsChange : 'settingsChange',
	TodoToggle : 'todoToggle',
	NoteTypeToggle : 'noteTypeToggle',
	SyncStart : 'syncStart',
	SessionEstablished : 'sessionEstablished',
	SyncComplete : 'syncComplete',
	ItemChange : 'itemChange',
	NoteAlarmTrigger : 'noteAlarmTrigger',
	AlarmChange : 'alarmChange',
	KeymapChange : 'keymapChange',
	NoteContentChange : 'noteContentChange',
	OcrServiceResourcesProcessed : 'ocrServiceResourcesProcessed',
	NoteResourceIndexed : 'noteResourceIndexed',
}

export class EventManager {

	emitter;
	appStatePrevious_;
	appStateWatchedProps_;
	appStateListeners_;

	constructor() {
		this.reset();
	}

	reset() {
		this.emitter_ = new EventEmitter();

		this.appStatePrevious_ = {};
		this.appStateWatchedProps_ = [];
		this.appStateListeners_ = {};
	}

	on(eventName, callback) {
		return this.emitter_.on(eventName, callback);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	emit(eventName, object = null) {
		return this.emitter_.emit(eventName, object);
	}

	removeListener(eventName, callback) {
		return this.emitter_.removeListener(eventName, callback);
	}

	off(eventName, callback) {
		return this.removeListener(eventName, callback);
	}

	filterOn(filterName, callback) {
		return this.emitter_.on(`filter:${filterName}`, callback);
	}

	filterOff(filterName, callback) {
		return this.removeListener(`filter:${filterName}`, callback);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	async filterEmit(filterName, object) {
		let output = object;
		const listeners = this.emitter_.listeners(`filter:${filterName}`);
		for (const listener of listeners) {
			// When we pass the object to the plugin, it is always going to be
			// modified since it is serialized/unserialized. So we need to use a
			// deep equality check to see if it's been changed. Normally the
			// filter objects should be relatively small so there shouldn't be
			// much of a performance hit.
			const newOutput = await listener(output);

			// Plugin didn't return anything - so we leave the object as it is.
			if (newOutput === undefined) continue;

			if (!fastDeepEqual(newOutput, output)) {
				output = newOutput;
			}
		}

		return output;
	}

	appStateOn(propName, callback) {
		if (!this.appStateListeners_[propName]) {
			this.appStateListeners_[propName] = [];
			this.appStateWatchedProps_.push(propName);
		}

		this.appStateListeners_[propName].push(callback);
	}

	appStateOff(propName, callback) {
		if (!this.appStateListeners_[propName]) {
			throw new Error('EventManager: Trying to unregister a state prop watch for a non-watched prop (1)');
		}

		const idx = this.appStateListeners_[propName].indexOf(callback);
		if (idx < 0) throw new Error('EventManager: Trying to unregister a state prop watch for a non-watched prop (2)');

		this.appStateListeners_[propName].splice(idx, 1);
	}

	stateValue_(state, propName) {
		const parts = propName.split('.');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Partially refactored old code from before rule was applied.
		let s = state;
		for (const p of parts) {
			if (!(p in s)) throw new Error(`Invalid state property path: ${propName}`);
			s = s[p];
		}
		return s;
	}

	// This function works by keeping a copy of the watched props and, whenever this function
	// is called, comparing the previous and new values and emitting events if they have changed.
	// The appStateEmit function should be called from a middleware.
	appStateEmit(state) {
		if (!this.appStateWatchedProps_.length) return;

		for (const propName of this.appStateWatchedProps_) {
			let emit = false;

			const stateValue = this.stateValue_(state, propName);

			if (!(propName in this.appStatePrevious_) || this.appStatePrevious_[propName] !== stateValue) {
				this.appStatePrevious_[propName] = stateValue;
				emit = true;
			}

			if (emit) {
				const listeners = this.appStateListeners_[propName];
				if (!listeners || !listeners.length) continue;

				const eventValue = Object.freeze(stateValue);
				for (const listener of listeners) {
					listener({ value: eventValue });
				}
			}
		}
	}

	once(eventName, callback) {
		return this.emitter_.once(eventName, callback);
	}

	// For testing only; only applies to listeners registered with .on.
	listenerCounter_(event) {
		const initialListeners = this.emitter_.listeners(event);
		return {
			getCountRemoved: () => {
				const currentListeners = this.emitter_.listeners(event);
				let countRemoved = 0;
				for (const listener of initialListeners) {
					if (!currentListeners.includes(listener)) {
						countRemoved ++;
					}
				}
				return countRemoved;
			},
		};
	}
}

const eventManager = new EventManager();

export default eventManager;
