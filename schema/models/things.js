/* @flow */

// TODO: FIXXX
import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose/node8';
import uuid from "../../lib/util/uuid";

export const ThingsSchema = new mongoose.Schema(
  {
	  _id: {
		  type: Buffer
	  },

	  id: {
		  type: String,
		  get: function () {
			  if (this._id) {
				  return this._id.toString('hex');
			  }
		  },
		  set: function (val) {
			  if (this._conditions && this._conditions.id) {
				  if (this._conditions.id.hasOwnProperty('$in')) {
					  this._conditions._id = {
						  $in: _.map(this._conditions.id.$in, function(item) {
							  return uuid(item);
						  })
					  };
				  }
				  else {
					  this._conditions._id = uuid(val);
				  }

				  delete this._conditions.id;
			  }

			  if (val.hasOwnProperty('$in')) {
				  this._id = {
					  $in: _.map(val.$in, function(item) {
						  return uuid(item);
					  })
				  };

			  }
			  else {
				  this._id = uuid(val);
			  }
		  }
	  },

	  connection: {
		  type: Buffer,
		  index: false
	  },

	  connection_id_string: {
		  type: String,
		  get: function() {
			  if (this.connection) {
				  return this.connection.toString('hex');
			  }
		  },
		  set: function(val) {
			  if (this._conditions && this._conditions.connection_id_string) {
				  this._conditions.connection = uuid(val);

				  delete this._conditions.connection_id_string;
			  }

			  this.connection = uuid(val);
		  }
	  },
  },
  {
    collection: 'things',
  }
);
  
export const Things = mongoose.model('Things', ThingsSchema);

export const ThingTC = composeWithMongoose(Things);