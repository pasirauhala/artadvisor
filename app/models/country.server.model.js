'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment');

/**
 * Country Schema
 */
var CountrySchema = new Schema({
  code: {
    type: String,
    required: 'Country code is required'
  },
  name: { 
    type: String, 
    required: 'Country name is required' 
  },
  lcase: String,
  translations: [{
    lang: {
      type: String,
      enum: ['en', 'fi', 'sv', 'de'],
      default: 'en'
    },
    value: {
      type: String,
      required: 'Translation is required'
    }
  }],
  created: { 
    type: Date, 
    default: Date.now 
  }
});

CountrySchema.set('toObject', {
  virtuals: true
});
CountrySchema.set('toJSON', {
  virtuals: true
});

mongoose.model('Country', CountrySchema); 
