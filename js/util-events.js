/**
 * util-events.js - The minimal events support
 */

var events = data.events = {};

// Bind event
rsjs.on = function(name, callback) {
	var list = events[name] || (events[name] = []);
	list.push(callback);
	return rsjs;
};

// Remove event. If `callback` is undefined, remove all callbacks for the
// event. If `event` and `callback` are both undefined, remove all callbacks
// for all events
rsjs.off = function(name, callback) {
	// Remove *all* events
	if (!(name || callback)) {
		events = data.events = {};
		return rsjs;
	}

	var list = events[name];
	if (list) {
		if (callback) {
			for ( var i = list.length - 1; i >= 0; i--) {
				if (list[i] === callback) {
					list.splice(i, 1);
				}
			}
		} else {
			delete events[name];
		}
	}

	return rsjs;
};

// Emit event, firing all bound callbacks. Callbacks receive the same
// arguments as `emit` does, apart from the event name
var emit = rsjs.emit = function(name, data) {
	var list = events[name], fn;

	if (list) {
		// Copy callback lists to prevent modification
		list = list.slice();

		// Execute event callbacks
		while ((fn = list.shift())) {
			fn(data);
		}
	}

	return rsjs;
};