'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment'),
  langs = ['en', 'fi', 'sv', 'de'];

/**
 * City Schema
 */
var CitySchema = new Schema({
  name: { 
    type: String, 
    required: 'City name is required' 
  },
  lcase: String,
  ascii: String,
  translations: [{
    lang: {
      type: String,
      enum: langs,
      default: 'en'
    },
    value: {
      type: String,
      required: 'Translation is required'
    }
  }],
  coordinates: {
    lat: Number,
    lng: Number
  },
  country: { 
    type: Schema.ObjectId, 
    ref: 'Country' 
  },
  created: { 
    type: Date, 
    default: Date.now 
  }
});

CitySchema.set('toObject', {
  virtuals: true
});
CitySchema.set('toJSON', {
  virtuals: true
});

CitySchema.virtual('lang').get(function() {
  // Self
  var self = this;
  // Loop
  this.translations.forEach(function(translation) {
    // If match
    if (translation.value === self.name) {
      // Return
      return translation.lang;
    }
  });
  return langs[0];
});

mongoose.model('City', CitySchema); 
