'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  async = require('async'),
  mongoose = require('mongoose'),
  moment = require('moment'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),
  User = mongoose.model('User'),
  api = require('./helpers/api.server.helper');

exports.search = {

  /**
   * Get all venues
   */
  index: function(req, res) {
    // Get query
    var q = req.query.q ? req.query.q.trim() : '';
    // If there's no query
    //if (!q) {
      // Print nothing
    //  api.json(res, []);
    //} else {
      // Do query
      async.parallel([
        // Events
        function(done) {

          // Set venues
          var venues = [], searchedVenues = false;

          // Do search for all
          async.parallel([
            // Search for venues
            function(mdone) {
              if (req.query.city) {
                // Set city
                Venue.find({
                  'address.city': exports.search.keywordCaseInsensitive(req.query.city)
                }).exec(function(err, docVenues) {
                  // Add to venues
                  if (docVenues) {
                    for (var v in docVenues) {
                      // Add to venues
                      venues.push(docVenues[v]._id);
                    }
                  }
                  // Searched venues
                  searchedVenues = true;
                  mdone();
                });
              } else {
                // Call done
                mdone();
              }
            }

          ], function(err, results) {
            // Set filters
            var filters = {};
            // If searched venues
            if (searchedVenues) {
              filters.venue = {
                $in: venues
              };
            }
            // Set date
            if (req.query.date) {
              var date = moment(req.query.date);
              // Set date
              filters.startDate = {
                $lte: req.query.date
              };
              filters.endDate = {
                $gte: req.query.date
              };
            }
            // Call events
            exports.search.events(done, filters, null, req.query, [], { name: 'exhibition', title: 'Events' });
          });

        },
        // Venues
        function(done) {
          // Venue filters
          var venueFilter = {};
          // If there's city
          if (req.query.city) {
            // Add to filter
            venueFilter['address.city'] = exports.search.keywordCaseInsensitive(req.query.city);
          }
          // Call venues
          exports.search.venues(done, venueFilter, null, req.query, [], { name: 'venue', title: 'Venues' });
        },
        // Artists
        function(done) {
          // Call artists
          exports.search.artists(done, {}, null, req.query, ['photo'], { name: 'artist', title: 'Artists' });
        }
      ], function(err, results) {
        // Print
        api.json(res, results);
      });
    //}
  },

  /**
   * Case insensitive
   */
  keywordCaseInsensitive: function(keyword) {
    return new RegExp(keyword.trim(), 'i');
  },

  /**
   * Search for cities
   */
  cities: function(req, res) {

    var query = req.query.q || '';
    // If there's nothing
    if (!query) {
      api.json(res, {
        data: [],
        count: 0
      });
      return false;
    }

    var start = req.query.start || 0,
        limit = req.query.limit || 20;

    Venue.find({
      'address.city': exports.search.keywordCaseInsensitive(query)
    }).distinct('address.city').exec(function(err, docs) {
      // Set count
      var count = docs.length;
      // Just return the results
      api.json(res, {
        data: docs ? docs.splice(start, limit) : [],
        count: count
      });
    });

  },

  /**
   * Add query to filters
   */
  q: function(filters, q, field) {
    // If there's no field
    if (!field) {
      // Set name as default
      field = 'name';
    }
    // If there's q
    if (q && q.trim()) {
      // search
      var search = exports.search.keywordCaseInsensitive(q);
      // Set filter
      filters[field] = search;
    }
    // Return
    return filters;
  },

  /**
   * Search events
   */
  events: function(done, filters, fields, query, populate, inject) {
    // If there's q
    if (query.q && query.q.trim()) {
      // Set q
      var q = exports.search.keywordCaseInsensitive(query.q);
      // Set filters
      filters.$or = [
        // Filter name
        { name: q },
        { genres: q }
      ];
    }
    // Do query
    api.query(done, Exhibition, filters, fields, query, populate, inject);
  },

  /**
   * Search venues
   */
  venues: function(done, filters, fields, query, populate, inject) {
    // If there's q
    if (query.q && query.q.trim()) {
      // Set q
      var q = exports.search.keywordCaseInsensitive(query.q);
      // Set filters
      filters.$or = [
        // Filter name
        { name: q },
        { venueTypes: q }
      ];
    }
    // Do query
    api.query(done, Venue, filters, fields, query, populate, inject);
  },

  /**
   * Search artists
   */
  artists: function(done, filters, fields, query, populate, inject) {
    // Set filters
    if (query.q) {
      // search
      var search = exports.search.keywordCaseInsensitive(query.q);

      // Set filters
      filters.$or = [
        {
          'name.first': search
        },
        {
          'name.last': search
        },
        {
          genres: search
        }
      ];
    }
    // Set profiletype
    filters.profileType = 'artist';
    // Do query
    api.query(done, User, filters, fields, query, populate, inject);
  },

  /**
   * Get suggestions
   */
  suggestions: function(req, res) {
    // Get top exhibitions
    api.query(function(err, results) {
      // Genres
      var genres = [];
      // If there's results
      if (!err && results && results.data) {
        // Loop through data
        for (var i in results.data) {
          // Get all genres
          var data = results.data[i];
          // Loop through genres
          if (data.genres) {
            for (var j in data.genres) {
              var genre = data.genres[j];
              // Push
              if (genres.indexOf(genre) < 0) {
                // Push
                genres.push(genre);
              }
            }
          }
        }
      }
      // Print
      api.json(res, genres);
      
    }, Exhibition, {}, null, { start: 0, limit: 5, sort: '-recommended' });
  }

};