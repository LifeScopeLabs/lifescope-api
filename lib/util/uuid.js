import bson from 'bson';
import mongoose from 'mongoose';
import nodeUUID from 'uuid/v4.js';
import uuidParse from 'uuid-parse';

export default function(value) {
	if (typeof value === 'string') {
		var uuidBuffer = new mongoose.Types.Buffer(uuidParse.parse(value));

		uuidBuffer.subtype(bson.Binary.SUBTYPE_UUID);

		return uuidBuffer.toObject();
	}
	else if (value == null) {
		return nodeUUID().replace(/-/g, '');
	}
	else {
		return value.toString('hex');
	}
}