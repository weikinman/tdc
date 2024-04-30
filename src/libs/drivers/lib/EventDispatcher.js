
// EventKeyType is used to distinguish events (e.g. a 'ClickEvent' vs a 'TouchEvent')
// while EventMessageType is the type of the data sent with an event (can be `void`)
export default class EventDispatche {
	// Partial marks all fields as optional. To initialize with an empty object, this is required.
	// See https://stackoverflow.com/a/64526384
	listeners;
	constructor() {
		this.listeners = {};
	}

	dispatch(eventName, event = null) {
		if (!this.listeners[eventName]) return;

		const ls = this.listeners[eventName];
		for (let i = 0; i < ls.length; i++) {
			ls[i](event);
		}
	}

	on(eventName, callback) {
		if (!this.listeners[eventName]) this.listeners[eventName] = [];
		this.listeners[eventName].push(callback);

		return {
			// Returns false if the listener has already been removed, true otherwise.
			remove: ()=> {
				const originalListeners = this.listeners[eventName];
				this.off(eventName, callback);

				return originalListeners.length !== this.listeners[eventName].length;
			},
		};
	}

	// Equivalent to calling .remove() on the object returned by .on
	off(eventName, callback) {
		if (!this.listeners[eventName]) return;

		// Replace the current list of listeners with a new, shortened list.
		// This allows any iterators over this.listeners to continue iterating
		// without skipping elements.
		this.listeners[eventName] = this.listeners[eventName].filter(
			otherCallback => otherCallback !== callback,
		);
	}
}
