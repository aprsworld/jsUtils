/*
 * object_merge(target, obj0, .... objn)
 *
 * CURRENTLY THE API IS SUBJECT TO CHANGE.
 *
 * Merges all objects or primatives into dst in order of appearance.  It will
 * intentionally ignore any properties that are explicitly set to undefined.
 * It does a 'deep merge' and will leave as much of the dst object intact and
 * will only copy primatives.  If an object is merged in that does not exist
 * in target, it will create a clone of the object being merged.  Attempts to
 * preserve self-referencing structures (XXX: Needs thought and work).
 *
 * Return Value:
 *	Returns undefined if no arguments are passed in.
 *	If the last argument is a primative, it will return that.
 *	If a primative is passed in anywhere else it will return a merged clone.
 *	Otherwise it returns target with all the remaining arguments merged in.
 *
 * Hooks:
 *	before(prop, dst, src): Called for each property after checking to make  *		sure the dst and src properties are not the same and that the
 *		src property is not a reference to the root dst object (in which
 *		case dst is just set with the reference). prop is the name of
 *		the property.  The return value is what is merged which normally
 *		should be src, but can be something else.
 *	after(prop, clone, merge): Called after processing each property
 *		and creating a clone (XXX: This needs thought as ideally the
 *		target should be preserved as much as possible).  The return
 *		value is what the property is actually assigned.
 *	XXX: The merging of target and obj0 through objn currently do not
 *		have any hooks.
 *
 * Notes:
 *	Eventually this function will be Object.prototype.Merge or similiar
 *	and will obtain hooks from the prototype of whatever is being merged
 *	or something more robust and "proper".
 *
 * Standards:
 *	Should comply with ECMA3 and work with all JavaScript implementations
 *	claiming compliance with that or future standards (at this time
 *	ECMAScript 2015 [ECMA6/ECMA Harmony]).
 */
var object_merge_hooks = {
	before: function(prop, dst, src) { return src; },
	after: function(prop, dst, src) { return dst; }
};

function object_merge () {
	"use strict";
	var length = arguments.length;
	var target = arguments[0];
	var hooks = object_merge_hooks;
	var last; // If this is defined, we return it instead of target

	// Can't merge less than 2 objects
	if (length < 2) {
		if (length == 1) {
			return target;
		}
		return undefined;
	}

	// Determine if the target is object is suitable for merging
	if (!target || typeof target !== 'object') {
		last = target;
		target = {};
	}

	// XXX: BUG: How to properly handle Arrays and "Functions"?

	// Merge all the arguments...
	for (var i = 1; i < length; i++) {
		var extension = arguments[i];

		// Ignore extension if it's undefined or the same as the target
		if (extension === undefined || extension === target) {
			// XXX: Should we warn if extension is target?
			continue;
		}

		// Call hook before processing object
		//extension = hooks.before(extension); // XXX: Seperate hook?

		// Handle extensions that are not objects
		if (!extension || typeof extension !== 'object') {
			target = {};
			last = extension;
			continue;
		}
		last = undefined;

		// Cycle through all the properties
		for (var prop in extension) {
			var src = extension[prop];
			var dst = target[prop];

			// Continue if the src and dst are the same
			if (src === dst) {
				continue;
			}

			// Prevent an infinite loop
			// XXX: How to properly handle self-referencing structs
			if (src === target) {
				target[prop] = target;
				continue;
			}

			// Call hook before processing object
			var merge = hooks.before(prop, dst, src);

			// Do the actual merge
			// XXX: Properly handle cloning... See comment at top.
			if (merge && typeof merge === 'object') {

				// Cloning src
				var clone = {};

				// We actually need an Array object...
				if (Array.isArray(dst) || Array.isArray(merge)) {
					clone = [];
				}

				// Do the actual clone and merge...
				clone = object_merge(clone, dst, merge);

				// Call hook after processing object
				merge = hooks.after(prop, clone, merge);
			}

			if (merge !== undefined) {
				target[prop] = merge;
			}
		}

		// Call hook after processing object
		//last = hooks.after(extension); // XXX: Seperate hook?
	}

	// The last extension was not an object, so return that value
	if (last !== undefined)
		return last;

	// Return the target object
	return target;
}

exports = module.exports;
exports.object_merge = object_merge;
exports.object_merge_hooks = object_merge_hooks;
