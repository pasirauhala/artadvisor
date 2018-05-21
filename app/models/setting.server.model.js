'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var defaults = {
  artCacheEvent: '',
  artCacheTitle: 'Art Cache|Taidek\u00e4tk\u00f6|Exklusiv konstsamling|Kunst Cache'
};

/**
 * Setting Schema
 */
var SettingSchema = new Schema({
  name: { type: String, require: 'Setting name is required' },
  value: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now }
});

SettingSchema.set('toObject', {
  virtuals: true
});
SettingSchema.set('toJSON', {
  virtuals: true
});

SettingSchema.statics.fetch = function(name, done) {
  // Get one
  this.findOne({ name: name }).exec(function(err, setting) {
    // If found
    if (!err && setting && setting._id) {
      // Call done
      done(setting);
    } else {
      // Create
      var Setting = mongoose.model('Setting');
      // New setting
      setting = new Setting({
        name: name,
        value: defaults[name] || ''
      });
      // Save
      setting.save(function(err, setting) {
        // Done
        done(setting);
      });
    }
  });
};

mongoose.model('Setting', SettingSchema);