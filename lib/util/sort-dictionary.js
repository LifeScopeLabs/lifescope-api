'use strict';

import type from 'type-detect';


export default function sortDictionary(input) {
	let unsortedResponse = {};

	for (let key in input) {
		if (!input.hasOwnProperty(key)) {
			return false;
		}

		let value = input[key];
		let valueType = type(value);

		if (valueType === 'object' || valueType === 'Object') {
			unsortedResponse[key] = sortDictionary(value);
		}
		else if (valueType === 'array' || valueType === 'Array') {
			let sortedItems = new Array(value.length);

			for (let i = 0; i < value.length; i++) {
				let item = value[i];
				let itemType = type(item);

				if (itemType === 'object' || itemType === 'Object') {
					sortedItems[i] = sortDictionary(item);
				}
				else {
					sortedItems[i] = item;
				}
			}

			unsortedResponse[key] = sortedItems.sort();
		}
		else {
			unsortedResponse[key] = value;
		}
	}

	let keys = Object.keys(unsortedResponse).sort();
	let response = {};

	for (let i = 0; i < keys.length; i++) {
		let key = keys[i];
		response[key] = unsortedResponse[key];
	}

	return response;
}
