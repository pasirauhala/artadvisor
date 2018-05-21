'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  q = require('q'),
  request = require('request'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  generator = require('./helpers/generator.server.helper'),
  api = require('./helpers/api.server.helper'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),
  Gallery = mongoose.model('Gallery'),
  User = mongoose.model('User'),
  City = mongoose.model('City'),
  Country = mongoose.model('Country'),
  moment = require('moment'),
  locationApi = require('./location.server.controller');

exports.help = {

  /**
   * Call this when you have no access to admin
   */
  noaccess: function(req, res) {

    // Password
    var password = generator.text(6);
    // Complete
    var complete = function(err, user) {  
      // Return
      api.json(res, {
        email: user.email,
        password: password,
        message: 'Please login with this provided admin access',
        error: err
      });
    };

    // Look for admin
    User.findOne({ roles: 'admin' }).exec(function(err, user) {
      // If there's any
      if (user && user._id) {
        // Reset password
        user.password = password;
        user.salt = '';
        // Save
        user.save(complete);
      } else {
        // Generate admin
        var admin = new User({
          profileType:  'artist',
          name:         { first: 'Art Advisor', last: 'Admin' },
          organization: 'Art Advisor',
          genres:       generator.genres(generator.number(1, 5)),
          description:  generator.lorem(),
          websites:     ['http://artadvisor.fi'],
          email:        'admin@artadvisor.fi',
          username:     'admin',
          password:     password,
          roles:        ['member', 'admin']
        });
        // Save
        admin.save(complete);
      }
    });
  },

  date: function(req, res) {

    var today = moment();

    // Print date
    api.json(res, {
      datetime: today, //.startOf('day'),
      date: today.clone().utc().startOf('day'),
      timezone: moment().utcOffset() / 60
    });
  },

  // Refresh exhibitions
  refresh: function(req, res) {
    // Find all
    Exhibition.find({}).exec(function(err, exhibitions) {
      // Loop through all exhibitions
      (exhibitions || []).forEach(function(exhibition) {
        // Simply save
        exhibition.save();
      });
      // Saved
      api.json(res, {
        message: 'Refresh succeeded'
      });
    });
  },

  // Galleries
  galleries: function(req, res) {
    // Get all galleries
    Gallery.find({}).deepPopulate(['photos.photo', 'photos.artists']).exec(function(err, galleries) {
      // Loop through galleries
      galleries.forEach(function(gallery) {
        // Loop through photos
        (gallery.photos || []).forEach(function(photo) {
          // Update photo
          photo.photo.gallery = gallery.id || (gallery._id || '').toString();
          photo.photo.exhibition = (gallery.exhibition && gallery.exhibition.name) ? gallery.exhibition.id : gallery.exhibition.toString();

          // If there's no nonUserArtists
          if (!photo.nonUserArtists || !photo.nonUserArtists.length) {
            // Set non user
            photo.nonUserArtists = [];
            // Loop through artists
            (photo.artists || []).forEach(function(artist) {
              // Set name
              photo.nonUserArtists.push({
                fullname: artist.name.full
              });
            });
          }

          // Save
          photo.photo.save(function(err, photo) {
            // If there's error
            if (err) {
              // Error
              console.log('Error saving photo...');
              console.log(err);
            }
          });
        });
        // Save gallery
        gallery.save(function(err, gallery) {
          if (err) {
            console.log('Error saving gallery...');
            console.log(err);
          }
        });
      });
      // Saved
      api.json(res, {
        message: 'Galleries updated'
      });
    });
  },

  series: function(array, callback, nextCallback, index) {
    // The promise
    var deferred = q.defer();
    // If index is undefined
    if (_.isUndefined(index)) {
      // Set index to 0
      index = 0;
    }
    // Get data
    var data = array[index++];
    // Resolve
    var resolve = function() {
      // If undefined
      if (_.isUndefined(array[index])) {
        // Resolve
        deferred.resolve();
      } else {
        // Next
        nextCallback(function() {
          // Do series recursively
          exports.help.series(array, callback, nextCallback, index)
            // Move next
            .then(deferred.resolve, deferred.resolve);
        });
      }
    };
    // Execute callback
    callback(data).then(resolve, resolve);
    // Return the promise
    return deferred.promise;
  },

  // Cities
  cities: function(req, res) {

    console.log(locationApi.location);

    // Update or select
    locationApi.location.fetchOrUpdateCities(function(data) {
      // Print
      api.json(res, data);
      // To update
    }, ((req.query || {}).update || '') === '1');
  },

  // Location
  locations: function(req, res) {
    // Get
    locationApi.location.fetchOrUpdateCities(function(data) {
      // Set unique
      // data.unique = ['Seinäjoki', 'Söderkulla', 'Tampere', 'Turku', 'Vantaa'];
      // Promises
      var cities = [],
          translated = [];
      // Done
      var done = function() {
        // Done
        console.log('Done fetching translations');
        // Print
        api.json(res, {
          cities: cities,
          translated: translated
        });
      };
      // Use series to avoid simultaneous queries
      exports.help.series(data.unique || [], function(cityName) {
        // Create promise
        var deferred = q.defer();
        // Call
        locationApi.location.translateCity(cityName).then(function(translatedCity) {
          // Add
          cities.push(cityName);
          translated.push(translatedCity);
          // Get lowercase
          var lcase = (translatedCity.name || '').toLowerCase();
          // Find city if exists
          City.findOne({ lcase: lcase }).exec(function(err, city) {
            // If found
            if (!err && city) {
              // Resolve
              deferred.resolve(city);
            } else {
              // Find countryName
              var countryName = translatedCity.country.translations.en,
                  countryLcase = (countryName || '').toLowerCase();
              // Create city
              var createCity = function(countryId) {
                // Create the City
                (new City({
                  name: translatedCity.name,
                  lcase: lcase,
                  ascii: locationApi.location.ascii(lcase),
                  translations: locationApi.location.toArrayTranslations(translatedCity.translations),
                  coordinates: translatedCity.coordinates,
                  country: countryId
                })).save(function(err, city) {
                  // Resolve city
                  deferred.resolve(city);
                });
              };
              // Find country
              Country.findOne({ lcase: countryLcase }).exec(function(err, country) {
                // If there's country
                if (!err && country) {
                  // Create country
                  createCity(country._id || country.id);
                } else {
                  // Create country
                  (new Country({
                    code: translatedCity.country.code,
                    name: countryName,
                    lcase: countryLcase,
                    // Convert to array
                    translations: locationApi.location.toArrayTranslations(translatedCity.country.translations)
                  })).save(function(err, country) {
                    // Create city
                    createCity(country._id || country.id);
                  });
                }
              });
            }
          });
        });
        // Return the promise
        return deferred.promise;
        // Do next
      }, function(next) {
        // Next
        console.log('Waiting 3 seconds before moving on to next city..');
        // Do next
        setTimeout(next, 3000);
        // Wait
      }).then(done, done);
    });
  }

};