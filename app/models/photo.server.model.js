'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  imageSize = require('image-size'),
  appRoot = require('app-root-path'),
	Schema = mongoose.Schema;

/**
 * Photo Schema
 */
var PhotoSchema = new Schema({
	title: { type: String, default: '' },
  order: { type: Number, default: 0 },
	source: { type: String, required: 'Image source url is required' },
  width: { type: Number, default: 0 },
  height: { type: Number, default: 0 },
  type: { type: String, trim: '' },
  artists: [{
    type: Schema.ObjectId,
    ref: 'User'
  }],
  created: { type: Date, default: Date.now },
	owner: { type: Schema.ObjectId, ref: 'Album' },
  gallery: { type: Schema.ObjectId, ref: 'Gallery' },
  exhibition: { type: Schema.ObjectId, ref: 'Exhibition' }
});

PhotoSchema.set('toObject', {
  virtuals: true
});
PhotoSchema.set('toJSON', {
  virtuals: true
});

/**
 * Hook a pre save method to save the dimensions of the image
 */
PhotoSchema.pre('save', function(next) {
  // Set this
  var photo = this;
  // Get size
  imageSize(appRoot + '/public/' + this.source, function(err, dimensions) {
    // If there's no error
    if (!err && dimensions) {
      // Set dimensions
      photo.width = dimensions.width;
      photo.height = dimensions.height;
    }
    // Next
    next();
  });
});

/**
 * Save photos
 */
PhotoSchema.statics.saveMultiple = function(photos, done, index) {
  // Get photo
  var Photo = mongoose.model('Photo');
  // If there's no index, use 0
  if (!index) {
    index = 0;
  }
  // If index last
  if (index >= photos.length) {
    // Done
    done(photos);
  } else {
    // Check if there's id
    if (photos[index]._id) {

      // console.log(photos[index]);

      // Just save
      photos[index].save(function(err, photo) {
        // Edit photos
        photos[index] = photo;
        // Recurse
        Photo.saveMultiple(photos, done, index + 1);
      });
    } else {
      // Create new photo
      var photo = new Photo(photos[index]);
      // Save
      photo.save(function(err, photo) {
        // Add
        photos[index] = photo;
        // Recurse
        Photo.saveMultiple(photos, done, index + 1);
      });
    }
  }
};

/**
 * Remove multiple
 */
PhotoSchema.statics.removeMultiple = function(photos, done, index) {
  // Get photo
  var Photo = mongoose.model('Photo');
  // If there's no index, use 0
  if (!index) {
    index = 0;
  }
  // If index last
  if (index >= photos.length) {
    // Done
    done();
  } else {
    // Check if there's id
    if (photos[index]._id) {
      // Remove
      photos[index].remove(function(info) {
        // Call
        Photo.removeMultiple(photos, done, index + 1);
      });
    } else {
      // Recurse anyway
      Photo.removeMultiple(photos, done, index + 1);
    }
  }
};

mongoose.model('Photo', PhotoSchema);
