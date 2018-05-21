'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  Comment = mongoose.model('Comment'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),
  Album = mongoose.model('Album'),
  Photo = mongoose.model('Photo'),
  User = mongoose.model('User'),
  City = mongoose.model('City'),
  api = require('./helpers/api.server.helper'),
  str = require('./helpers/str.server.helper'),
  generator = require('./helpers/generator.server.helper'),
  notification = require('./helpers/notification.server.helper'),
  Iconv = require('iconv').Iconv,
  async = require('async'),
  q = require('q'),
  locationApi = require('./location.server.controller').location;

// Cities cache
var citiesCache = [],
    restartCache = true;

// Export
exports.venues = {

  /**
   * Get all venues
   */
  index: function(req, res) {
    // User
    var user = (req.token && req.token.user) ? req.token.user : null;
    // Search
    var filters = {}, callbacks = [];
    // If there's q
    if (req.query.q) {
      // Set to query
      req.query.name = req.query.q;
    }

    // Loop through recognized filters
    ['name', 'address', 'owner'].forEach(function(filter) {
      // If there's any
      if (req.query && req.query[filter]) {
        // search
        var search = new RegExp(req.query[filter], 'i');
        // Select filter
        switch (filter) {
          case 'name':
            // Create filter
            filters.name = search;
            break;
          case 'address':
            // Set address
            filters.$or = [
              { 'address.line1': search },
              { 'address.city': search }
            ];
            break;
          case 'owner':
            // Create a callback
            callbacks.push(function(done) {
              // Search for user first
              User.find({
                $or: [
                  { 'name.first': search },
                  { 'name.last': search }
                ]
              }, 'id profileType').exec(function(err, users) {
                // Ids
                var ids = [];
                // Loop through users
                (users || []).forEach(function(user) {
                  // Add id
                  ids.push(user.id || user._id);
                });
                // Add to filters
                filters.owner = {
                  $in: ids
                };
                // Call done
                done();
              });
            });
            break;
        }
      }
    });

    // Execute all callbacks first
    async.parallel(callbacks, function() {
      // Execute
      api.find(res, Venue, filters, null, req.query, [
        'address.country',
        'owner'
      ], null, {
        owned: function(venue) {
          return user && ((venue.owner._id.toString() === user._id.toString()) ||
                          (user.roles.indexOf('admin') >= 0));
        }
      });
    });
  },

  /**
   * Get single venue
   */
  show: function(req, res) {
    // User
    var user = (req.token && req.token.user) ? req.token.user : null;
    // Find by permalink
    Venue.findOne({ permalink: req.params.permalink.toLowerCase() })
      .deepPopulate([
        'address.country',
        'owner',
          'owner.photo',
        'album',
          'album.photos'
      ])
      .exec(function(err, venue) {
        // If error
        if (err || !venue) {
          api.error(res, 400);
        } else {
          // Get exhibitions
          Exhibition.find({
            venue: venue._id,
            additional: false
          })
          	.sort({created: 'desc'})
            .deepPopulate([
              'owner',
              'gallery',
                'gallery.photos.photo',
                  'gallery.photos.artists'
            ])
            .exec(function(err, exhibitions) {
              // Show model
              api.showModel(res, err, venue, {
                owned: user && ((venue.owner._id.toString() === user._id.toString()) ||
                                (user.roles.indexOf('admin') >= 0)),
                exhibitions: exhibitions,
                favorite: (req.token &&
                            req.token.user &&
                            venue._id &&
                            venue.isFavoriteOf(req.token.user)),
                recommend: (req.token &&
                            req.token.user &&
                            venue._id &&
                            venue.isRecommendedBy(req.token.user))
              });
            });
        }
      });
  },

  /**
   * Create
   */
  create: function(req, res) {
    // Set inputs
    var inputs = {
      venueType: req.body.venueType || '',
      venueTypes: req.body.venueTypes || [],
      name: req.body.name || '',
      address: {
        line1: req.body.address.line1 || '',
        city: req.body.address.city || '',
        ascii: locationApi.ascii((req.body.address.city || '').toLowerCase()),
        country: 
          (req.body.address.country && req.body.address.country[0]) ?
          (req.body.address.country[0]._id || req.body.address.country[0].id || req.body.address.country[0]) : null,
        lang: req.body.address.lang || 'en',
        coordinates: req.body.address.coordinates || { latitude: 61.92410999999999, longitude: 25.748151 }
      },
      description: req.body.description || '',
      admissionFee: req.body.admissionFee || 'free',
      website: req.body.website || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      openingHours: req.body.openingHours || [],
      specialHours: req.body.specialHours || [],
      openByAppointment: !!req.body.openByAppointment,
      exceptionalOpeningHours: req.body.exceptionalOpeningHours || '',
      writtenInMedia: req.body.writtenInMedia || ''
    };

    var required = [
      { value: inputs.name, message: 'Venue name is required' },
      { value: inputs.address.line1, message: 'Address is required' },
      { value: inputs.address.city, message: 'Address is required' },
      { value: inputs.description, message: 'Information is required' },
      { value: inputs.email, message: 'Email is required' }
    ];

    // Make sure required inputs are set
    for (var i in required) {
      if (!required[i].value) {
        // Set error
        return api.success(res, required[i].message, true);
      }
    }

    // Require venue types
    if (!inputs.venueTypes.length) {
      return api.success(res, 'Venue type is required', true);
    }

    if (!/.+\@.+\..+/.test(inputs.email)) {
      return api.success(res, 'Invalid email address', true);
    }

    // Validate opening hours
    if (!Exhibition.validateOpeningHours(inputs.openingHours)) {
      return api.success(res, 'Verify opening hours range', true);
    }
    // Validate special hours
    if (!Exhibition.validateSpecialHours(inputs.specialHours)) {
      return api.success(res, 'Verify special hours', true);
    }

    // Require photos
    if (!req.body.photos || !req.body.photos.length) {
      // Error
      return api.success(res, 'Must have at least 1 photo for the venue', true);
    }

    // Acquire links
    if (req.body.links) {
      // Set links
      var links = [];
      // Loop
      for (var l in req.body.links) {
        // Get link
        var link = req.body.links[l];
        // Make sure url is present
        if (link.url) {
          // Cleanup link
          link.url = str.cleanupLink(link.url);
          // Add link
          links.push(link);
        }
      }
      // Set links
      inputs.links = links;
    }

    // Create album
    var album = new Album({
      title: ''
    });
    // Save
    album.save(function(err, album) {
      // Done creating
      var albumDone = function(album) {
        // Generate permalink
        Venue.generatePermalink(inputs.name, function(permalink, permalinkSafe) {
          // Set permalinks
          inputs.permalink = permalink;
          inputs.permalinkSafe = permalinkSafe;
          inputs.owner = req.token.user._id;
          inputs.album = album._id;

          // Create venue
          var venue = new Venue(inputs);
          // Save
          venue.save(function(err, venue) {
            // Restart
            restartCache = true;
            // Save city
            locationApi.findCity(inputs.address.city, true).then(function() {
              // Print
              api.data(res, venue);
            });
          });
        });
      };
      // Create photos
      if (req.body.photos && req.body.photos.length > 0) {
        // Insert photos
        album.insertPhotos(req.body.photos, albumDone);
      } else {
        albumDone(album);
      }
    });
  },

  /**
   * Update
   */
  update: function(req, res) {
    // Find by permalink
    Venue.findOne({ permalink: req.params.permalink.toLowerCase() })
      // Populate
      .deepPopulate([
        'address.country'
      ])
      // Execute search
      .exec(function(err, venue) {
        // If nothing
        if (!venue) {
          // Not found
          api.error(res, 400);
          return false;
        }
        // Set updateable
        venue.venueType = req.body.venueType || venue.venueType;
        venue.venueTypes = req.body.venueTypes || venue.venueTypes;
        venue.name = req.body.name;
        venue.address.line1 = (req.body.address && req.body.address.line1) ? req.body.address.line1 : venue.address.line1;
        venue.address.city = (req.body.address && req.body.address.city) ? req.body.address.city : venue.address.city;
        venue.address.ascii = locationApi.ascii((venue.address.city || '').toLowerCase());
        venue.address.country = 
          (req.body.address && req.body.address.country && req.body.address.country[0]) ? 
          (req.body.address.country[0]._id || req.body.address.country[0].id || req.body.address.country[0] || null) : 
          (venue.address.country._id || venue.address.country.id || venue.address.country);
        venue.address.lang = req.body.address.lang || venue.address.lang || 'en';
        venue.address.coordinates = (req.body.address && req.body.address.coordinates) ? req.body.address.coordinates : venue.address.coordinates;
        venue.description = req.body.description;
        venue.admissionFee = req.body.admissionFee;
        venue.website = req.body.website;
        venue.phone = req.body.phone;
        venue.email = req.body.email;

        venue.openByAppointment = !!req.body.openByAppointment;

        var openingHours = req.body.openingHours || [];
        var specialHours = req.body.specialHours || [];

        venue.exceptionalOpeningHours = req.body.exceptionalOpeningHours || venue.exceptionalOpeningHours;
        venue.writtenInMedia = req.body.writtenInMedia || venue.writtenInMedia;

        // Require owner
        if (!req.body.owner || !req.body.owner[0] || !req.body.owner[0].id) {
          // Error
          return api.success(res, 'Owner is required', true);
        }

        var required = [
          { value: venue.name, message: 'Venue name is required' },
          { value: venue.address.line1, message: 'Address is required' },
          { value: venue.address.city, message: 'Address is required' },
          { value: venue.description, message: 'Information is required' },
          { value: venue.email, message: 'Email is required' }
        ];

        // Make sure required inputs are set
        for (var i in required) {
          if (!required[i].value) {
            // Set error
            return api.success(res, required[i].message, true);
          }
        }

        // Require venue types
        if (!venue.venueTypes.length) {
          return api.success(res, 'Venue type is required', true);
        }

        if (!/.+\@.+\..+/.test(venue.email)) {
          return api.success(res, 'Invalid email address', true);
        }

        // Validate opening hours
        if (!Exhibition.validateOpeningHours(openingHours)) {
          return api.success(res, 'Verify opening hours range', true);
        }
        // Validate special hours
        if (!Exhibition.validateSpecialHours(specialHours)) {
          return api.success(res, 'Verify special hours', true);
        }

        // Require photos
        if (!req.body.photos || !req.body.photos.length) {
          // Error
          return api.success(res, 'Must have at least 1 photo for the venue', true);
        }

        // Set to model
        venue.openingHours = openingHours;
        venue.specialHours = specialHours;

        // Acquire links
        if (req.body.links) {
          // Set links
          var links = [];
          // Loop
          for (var l in req.body.links) {
            // Get link
            var link = req.body.links[l];
            // Make sure url is present
            if (link.url) {
              // Cleanup link
              link.url = str.cleanupLink(link.url);
              // Add link
              links.push(link);
            }
          }
          // Set links
          venue.links = links;
        }

        // Set owner
        venue.owner = req.body.owner[0].id;

        // Update album
        var updateAlbum = function(album) {
          // Just update
          album.updatePhotos(req.body.photos || [], function(album) {
            // Restart
            restartCache = true;
            // Save city
            locationApi.findCity(venue.address.city, true).then(function() {
              // Respond
              api.data(res, venue);
            });
          });
        };

        // Change permalink
        Venue.generatePermalink(venue.name, function(permalink, permalinkSafe) {
          // If permalink is not the same
          if (venue.permalinkSafe !== permalinkSafe) {
            // Change
            venue.permalink = permalink;
            venue.permalinkSafe = permalinkSafe;
          }

          // Save
          venue.save(function(err, venue) {
            // Check if there's no album
            if (!venue.album) {

              // Create an album
              var album = new Album({
                title: ''
              });
              album.save(function(err, album) {
                // Set venue album
                venue.album = album._id;
                venue.save(function(err, venue) {
                  // Update
                  updateAlbum(album);
                });
              });
            } else {

              // Get album
              Album.findOne({ _id: (venue.album._id || venue.album).toString() }).exec(function(err, album) {

                // If there's no album
                if (!err && !album) {
                  // Create album
                  (new Album({ title: '' })).save(function(err, album) {
                    // Set album
                    venue.album = album._id;
                    venue.save(function(err, venue) {
                      // Update
                      updateAlbum(album);
                    });
                  });
                } else {
                  // Update
                  updateAlbum(album);
                }

              });
            }
          });
        });
      });
  },

  /**
   * Delete
   */
  delete: function(req, res) {

    // User
    var user = (req.token && req.token.user) ? req.token.user : null;
    // Find by permalink
    Venue.findOne({ permalink: req.params.permalink.toLowerCase() })
      .deepPopulate(['owner'])
      .exec(function(err, venue) {

      // If nothing
      if (!venue) {
        // Not found
        api.error(res, 400);
        return false;
      }
      // Owned
      var owned = user && ((venue.owner._id.toString() === user._id.toString()) ||
                          (user.roles.indexOf('admin') >= 0));
      // If not owned
      if (!owned) {
        // Error
        api.error(res, 400);
      }
      // Delete
      Venue.findOne({ _id: venue._id.toString() }).remove(function(err) {

        // Update all exhibitions
        Exhibition.find({ venue: venue._id.toString() }).exec(function(err, exhibitions) {
          // If there's any
          if (!err && exhibitions && exhibitions.length) {
            // Loop
            exhibitions.forEach(function(exhibition) {
              // Update
              exhibition.venue = null;
              exhibition.save(function(err, exhibition) {
                // Do nothing
              });
            });
          }
          // Success
          api.success(res, 'Venue successfully deleted');
        });

      });
    });
  },

  /**
   * Favorite
   */
  favorite: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        req.token.user.favorite(venue, function() {
          api.success(res, 'Venue succesfully favorited');
        });
      }
    });
  },

  /**
   * Remove favorite
   */
  unfavorite: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        req.token.user.unfavorite(venue, function() {
          api.success(res, 'Venue succesfully unfavorited');
        });
      }
    });
  },

  /**
   * Recommend
   */
  recommend: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        req.token.user.recommend(venue, function() {
          api.success(res, 'Venue succesfully recommended');
        });
      }
    });
  },

  /**
   * Remove recommend
   */
  unrecommend: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        req.token.user.unrecommend(venue, function() {
          api.success(res, 'Venue succesfully unrecommended');
        });
      }
    });
  },

  /**
   * Get comments
   */
  getComments: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        // Set filters
        var filters = {
          venue: venue._id
        };

        // Set start
        req.query.start = 0;
        // If there's earliest
        if (req.query.earliest) {
          // Set
          filters.created = {
            $lt: req.query.earliest
          };
        }

        // Sort
        req.query.sort = {
          created: -1
        };

        // Get first comment
        Comment.findOne({
          venue: venue._id
        }, {
          limit: 1,
          sort: 'created'
        }).exec(function(err, comment) {

          // console.log(err);

          // Do query
          api.query(function(err, response) {
            // If there's error
            if (err) {
              api.error(res, 'Error retrieving documents');
            } else {

              response.last = (response.data && comment &&
                              response.data[response.data.length - 1].id === comment.id) ||
                              !comment || !response.data.length;

              api.json(res, response);
            }
          }, Comment, filters, null, req.query, ['owner']);
        });
      }
    });
  },

  /**
   * Post comment
   */
  postComment: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        // Create new comment
        var comment = new Comment({
          content: req.body.content,
          venue: venue._id,
          owner: req.token.user._id
        });
        // Save
        comment.save(function(err, comment) {
          // Set comment
          comment = comment.toJSON();
          // Set owner
          comment.owner = req.token.user;
          // Display
          res.json(comment);
        });
      }
    });
  },

  /**
   * Delete comment
   */
  deleteComment: function(req, res) {
    // Get
    Venue.findOne({ permalink: req.params.permalink }).exec(function(err, venue) {
      // If error
      if (err || !venue) {
        res.json({ });
      } else {
        // Create new comment
        // var comment = new Comment({
        //   content: req.body.content,
        //   venue: venue._id,
        //   owner: req.token.user._id
        // });

        // Get comment by id
        Comment.findOne({ _id: req.params.id }).remove().exec(function(err) {
          // Done
          res.json({ });
        });
      }
    });
  },

  /**
   * Cities cache
   */
  cachedCities: function(reset) {
    // Create promise
    var deferred = q.defer();
    // If there's something in cache
    // if (citiesCache.length && !reset) { // && !restartCache) {
      // Resolve
      // deferred.resolve(citiesCache);
    // } else {
      // Remove
      restartCache = false;
      // Empty
      citiesCache.length = 0;
      // Loop through venues
      Venue.find({ }).exec(function(err, venues) {
        // All cities
        var allCities = [];
        // Loop
        (venues || []).forEach(function(venue) {
          // Add to cache
          allCities.push((venue.address.city || '').toLowerCase());
        });
        // Find cities
        City.find({
          lcase: {
            $in: allCities
          }
        }).deepPopulate([
          'country'
        ]).exec(function(err, cities) {
          // Add to cities cache
          citiesCache.push.apply(citiesCache, cities || []);
          // Resolve
          deferred.resolve(citiesCache);
        });
      });
    // }
    // Return the promise
    return deferred.promise;
  },

  /**
   * Get all cities
   */
  cities: function(req, res) {
    // Get cached
    exports.venues.cachedCities().then(function(cities) {
      // Print
      api.json(res, cities);
    });
  },

  /**
   * Refresh
   */
  refresh: function(req, res) {
    // Get all venues
    Venue.find({ }).exec(function(err, venues) {
      // Loop through venues
      (venues || []).forEach(function(venue) {
        // Set ascii
        venue.address.ascii = locationApi.ascii((venue.address.city || '').toLowerCase());
        // Save
        venue.save(function(err, venue) {
          // Done
        });
      });
    });
    // Done
    api.success(res, 'Venues successfully refreshed');
  }

};
