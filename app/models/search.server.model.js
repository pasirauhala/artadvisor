'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment');

/**
 * Search Schema
 */
var SearchSchema = new Schema({
  name: { type: String, required: 'Name is required', trim: true },
  keyword: { type: String, required: 'Keyword is required', trim: true },
  date: { type: Date, required: 'Date is required' },
  city: { type: String, required: 'City is required', trim: true },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  user: { type: Schema.ObjectId, ref: 'User' }
});

SearchSchema.set('toObject', {
  virtuals: true
});
SearchSchema.set('toJSON', {
  virtuals: true
});

mongoose.model('Search', SearchSchema);