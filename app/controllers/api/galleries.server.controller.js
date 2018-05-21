'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  Gallery = mongoose.model('Gallery'),
  Photo = mongoose.model('Photo'),
  Exhibition = mongoose.model('Exhibition'),
  api = require('./helpers/api.server.helper'),
  moment = require('moment');

var shuffle = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
};

exports.galleries = {

  /**
   * Get all exhibitions
   */
  index: function(req, res) {

    // Get today
    var today = moment();

    Exhibition.find({
      additional: false,
      startDate: {
        $lte: today
      },
      endDate: {
        $gte: today
      }
    }, { sort: 'startDate' })
    // Populate venue
    .deepPopulate(['venue'])
    .exec(function(err, exhibitions) {

      var allIds = [], allExhibitions = {};

      // Get all ids
      if (exhibitions) {
        for (var i in exhibitions) {
          allIds.push(exhibitions[i]._id);
          // allExhibitions[exhibitions[i].id || exhibitions[i]._id] = exhibitions[i];
        }
      }

      var filter = {
        exhibition: {
          $in: allIds
        }
      };

      if (req.body.exclude) {
        filter._id = {
          $nin: (req.body.exclude || '').split(',')
        };
      }

      var limit = (req.body || req.query || {}).limit || 12;

      Photo.find(filter, 'id').exec(function(err, photos) {
        // Photo ids
        var ids = [];
        // If there are photos
        if (photos) {
          // Shuffle photos
          shuffle(photos);
          // Get first limit
          for (var i = 0; i < limit; i++) {
            // If there's any
            if (photos[i] && photos[i].id) {
              // Append
              ids.push(photos[i].id);
            }
          }
        }

        // Execute
        api.find(res, Photo, { _id: { $in: ids } }, null, {}, [
          'gallery',
            'gallery.exhibition',
            'gallery.photos.artists'
        ]);
      });

    });

  },

  /**
   * Get single gallery
   */
  show: function(req, res) {
    Gallery.findOne({ _id: req.params.id }, null, function(err, gallery) { 
      // Show model
      api.showModel(res, err, gallery);
    });
  }

};