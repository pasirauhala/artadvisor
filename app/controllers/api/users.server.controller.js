'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors.server.controller'),
	mongoose = require('mongoose'),
	passport = require('passport'),
  async = require('async'),
	User = mongoose.model('User'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),
  Search = mongoose.model('Search'),
  Photo = mongoose.model('Photo'),
  Album = mongoose.model('Album'),
  api = require('./helpers/api.server.helper'),
  notification = require('./helpers/notification.server.helper'),
  generator = require('./helpers/generator.server.helper'),
  str = require('./helpers/str.server.helper'),
  moment = require('moment');

exports.users = {

  /**
   * Me
   */
  me: function(req, res) {
    // Get user
    User.findOne({ _id: req.token.user._id }).select('+changeEmail')
      .deepPopulate([
        'photo', 
        'album', 
          'album.photos', 
            'album.photos.artists'
      ]).exec(function(err, user) {
      // Print
      api.json(res, user);
    });
  },

  /**
   * Update
   */
  updateMe: function(req, res) {
    // Loop through
    if (req.body.user) {
      // Restrict
      var restrict = [
        'email',
        'username',
        'password',
        'salt',
        'social',
        'roles',
        'updated',
        'created'
      ];

      for (var i in req.body.user) {
        // If in restrict
        if (restrict.indexOf(i) >= 0) {
          // Skip
          continue;
        }
        // Set user
        req.token.user[i] = req.body.user[i];
      }
      // Save user
      req.token.user.save(function(err, user) {
        // If there's error
        if (err) {
          api.error(res, err);
        } else {
          api.json(res, user);
        }
      });
    } else {
      // Return empty
      api.json(res, {});
    }
  },

  /**
   * Close account
   */
  deleteMe: function(req, res) {
    // Deactivate
    req.token.status = 'inactive';
    req.token.save(function(err, token) {
      // Destroy 
      req.session.token = '';
      User.findOne({ _id: req.token.user._id }).remove(function(err) {
        // Delete
        api.success(res, 'Account succcessfully closed');
      });
    });
  },

  /**
   * Unlink social
   */
  unlinkSocial: function(req, res) {
    // Get social
    var social = req.params.social;
    // Loop through social
    if (req.token.user.social) {
      for (var i in req.token.user.social) {
        // Ifmatch
        if (req.token.user.social[i].name === social) {
          // Remove
          req.token.user.social.splice(i, 1);
          break;
        }
      }
      // Save
      req.token.user.save(function(err, user) {
        // Return
        api.json(res, err ? req.token.user.social : user.social);
      });
    } else {
      api.json(res, req.token.user.social);
    }
  },

  /**
   * Change photo
   */
  photo: function(req, res) {
    // Get source
    var source = req.body.source;

    // If there's no source
    if (!source) {
      // Exit
      api.json(res, {});
      return false;
    }

    // Create a photo
    var photo = new Photo({
      source: source
    });
    photo.save(function(err, photo) {
      // If there's error
      if (err) {
        api.error(res, err);
      } else {
        // Set user photo
        req.token.user.photo = photo._id;
        // Save user
        req.token.user.save(function(err, user) {
          // If there's error
          if (err) {
            api.error(res, err);
          } else {
            api.json(res, photo);
          }
        });
      }
    });
  },

  /**
   * Insert photo
   */
  createPhoto: function(req, res) {
    // Get source
    var source = req.body.source;

    // If there's no source
    if (!source) {
      // Exit
      api.json(res, {});
      return false;
    }

    // Get album
    (function(done) {
      // If there's no album
      if (!req.token.user.album) {
        // Create the album
        (new Album({
          title: 'Artist Photos'
        })).save(function(err, album) {

          // If there's no album
          if (err || !album) {
            // Error
            api.json(res, {});
          } else {
          // Set this as user's album
            req.token.user.album = album._id;
            // save
            req.token.user.save(function(err, user) {
              // If err
              if (err) {
                api.json(res, {});
              } else {
                // Call done
                done(album);
              }
            });
          }

        });
      } else {
        // Load album
        Album.findOne({ _id: req.token.user.album }).deepPopulate('photos').exec(function(err, album) {
          // If there's no album
          if (err || !album) {
            // Error
            api.json(res, {});
          } else {
            // Done
            done(album);
          }
        });
      }
    })(function(album) {
      // Insert photo
      album.insertPhotos([source], function(album, photos) {
        // Update artists
        photos[0].artists = [req.token.user];
        photos[0].save(function(err, photo) {
          // Populate
          Photo.findOne({ _id: photo._id }).deepPopulate(['artists']).exec(function(err, photo) {
            // Print photo
            api.json(res, photo);
          });
        });
      });
    });
  },

  /**
   * Update single photo
   */
  updatePhoto: function(req, res) {
    // Get id
    var id = req.params.id;
    // If there's album
    if (req.token.user.album) {
      // Load
      Album.findOne({ _id: req.token.user.album }).deepPopulate('photos').exec(function(err, album) {
        // Find photo with the id
        if (!err && album && album.photos.length) {
          // Loop
          album.photos.forEach(function(photo) {
            // If match
            if (photo.id === id) {
              // Update
              if (typeof req.body.title !== 'undefined') {
                // Set title
                photo.title = req.body.title;
              }
              if (typeof req.body.artists) {
                photo.artists = req.body.artists;
              }
              // Save
              photo.save(function(err, photo) {

              });
            }
          });
          // Success
          api.success(res, 'Photo successfully updated');
        } else {
          // Error
          api.success(res, 'Photo does not exist', true);
        }
      });
    } else {
      // Error
      api.success(res, 'User has no photos', true);
    }
  },

  /**
   * Delete single photo
   */
  deletePhoto: function(req, res) {
    // Get id
    var id = req.params.id;
    // If there's album
    if (req.token.user.album) {
      // Load
      Album.findOne({ _id: req.token.user.album }).exec(function(err, album) {
        // If there's any
        if (!err && album) {
          // Delete single
          album.deletePhotos(id, function(deleted) {
            // Print
            api.success(res, deleted ? 'Photo successfully deleted' : 'Failed to delete photo', !deleted);
          });
        } else {
          // Error
          api.success(res, 'Failed to delete photo', true);
        }
      });
    } else {
      // Error
      api.success(res, 'User has no photos', true);
    }
  },

  /**
   * Update username
   */
  username: function(req, res) {

    var username = req.body.username.toLowerCase();
    // Test
    if (/^[a-z][a-z0-9\.]*[a-z0-9]$/.test(username)) {
      // Make sure username is unique
      User.findOne({ username: username }).exec(function(err, user) {
        // If there's any
        if (user) {
          api.success(res, 'Username already in use', true);
        } else {
          // Save
          req.token.user.username = username;
          req.token.user.save(function() {
            api.success(res, 'Username successfully changed');
          });
        }
      });
    } else {
      // Invalid format
      api.success(res, 'Username must be alphanumeric and must begin with a letter', true);
    }
  },

  /**
   * Update password
   */
  password: function(req, res) {
    // Make sure to get user
    User.findOne({ _id: req.token.user._id }, '+password +salt').exec(function(err, user) {
      // Make sure password is correct
      if (user.authenticate(req.body.old)) {
        // If there's no password
        if (!req.body['new']) {
          // error
          api.success(res, 'Password cannot be empty', true);
          return false;
        }
        // Change password
        user.password = req.body['new'];
        user.save(function(err, user) {
          // Send success
          api.success(res, 'Password successfully changed');
        });
      } else {
        // Invalid
        api.success(res, 'Invalid old password', true);
      }
    });
  },

  /**
   * Update email
   */
  email: function(req, res) {

    // Check if there's email and code
    if (req.body.email && req.body.code) {

      // Look for email
      User.findOne({ email: req.body.email }, '+changeEmail +changeEmailCode').exec(function(err, user) {

        // If there's error or no user
        if (err || !user) {
          api.success(res, 'Invalid email address', true);
        } else {
          // Check if code do not match
          if (user.changeEmailCode !== req.body.code) {
            api.success(res, 'Invalid email change code', true);
          } else {

            // Make sure email is not in use
            User.findOne({ email: user.changeEmail }).exec(function(err, otherUser) {
              // If there's any
              if (otherUser && otherUser._id) {
                // Error
                api.success(res, 'Email already in use', true);
              } else {
                // Update
                user.email = user.changeEmail;
                user.changeEmail = '';
                user.changeEmailCode = '';

                // Save
                user.save(function(err, user) {
                  // If there's error
                  if (err) {
                    console.log(err);
                  }
                  // Return 
                  api.success(res, user.email);
                });
              }
            });

          }
        }

      });

    } else {
      // Make sure email is not in use
      User.findOne({ email: req.body.email }).exec(function(err, user) {

        if (user && user._id) {
          // Error
          api.success(res, 'Email already in use', true);
        } else {
          // Code
          var emailCode = generator.text(16);
          // Set changeEmail
          req.token.user.changeEmail = req.body.email;
          req.token.user.changeEmailCode = emailCode;
          // Save
          req.token.user.save(function(err, user) {
            // If there's error
            if (err) {
              api.success(res, 'Please fill a valid email', true);
            } else {

              var hostUrl = req.protocol + '://' + req.headers.host;

              var content = notification.template('change-email', {
                name: req.token.user.name.full,
                link: hostUrl + '/settings?email=' + str.urlencode(req.token.user.email) + '&code=' + str.urlencode(emailCode)
              });

              // Notification
              notification.email({
                name: req.token.user.name.full,
                email: req.body.email
              }, 'Change Email Address', content, function(err, response) {
                // If there's error
                if (err) {
                  api.success(res, err, true);
                } else {
                  api.success(res, 'Please check your new email address for verification');
                }
              });

            }
          });
        }

      });
    }
  },

  /**
   * Searches
   */
  searches: function(req, res) {
    // Get searches
    api.find(res, Search, {
      user: req.token.user._id
    }, null, req.query, []);
  },

  /**
   * Profile
   */
  profile: function(req, res) {
    // Find user
    User.findOne({ _id: req.token.user._id })
      .deepPopulate([
        'photo',
        'favorites.artists',
        'favorites.venues',
          'favorites.venues.album',
            'favorites.venues.album.photos'
      ])
      .exec(function(err, user) {
        // Set inject
        var inject = {}, favoriteExhibitions = [];

        // Check for favorites
        if (user.favorites && user.favorites.exhibitions && user.favorites.exhibitions.length) {  
          // Set new favorites
          var exhibitions = [], today = moment();

          // Loop through favorites
          for (var i in user.favorites.exhibitions) {
            // Get exhibition
            var exhibition = user.favorites.exhibitions[i];

            // If there's no id
            if (!exhibition.name) {
              // Skip
              continue;
            }

            var startDate = moment(exhibition.startDate),
                endDate = moment(exhibition.endDate);

            if (today.diff(startDate, 'days') >= 0 &&
                endDate.diff(today, 'days') >= 0) {
              // This is a valid favorite
              exhibitions.push(exhibition);
            }
          }
          // Set new exhibitions
          user.favorites.exhibitions = exhibitions;
        }

        // Use parallel
        async.parallel([
          // Get exhibitions
          function(done) {
            // Find exhibitions
            Exhibition.find({ 
              $or: [
                { owner: user._id },
                { 'artists.user': user._id }
              ]
            }).sort('-created').deepPopulate([
                'artists',
                'gallery',
                  'gallery.photos',
                    'gallery.photos.photo'
              ])
              .exec(function(err, exhibitions) {
                // Set it
                inject.exhibitions = exhibitions;
                // Call done
                done();
              });
          },
          // Get venues
          function(done) {
            // Find venues
            Venue.find({ owner: user._id })
              .sort('-created')
              .deepPopulate([
                'album', 
                  'album.photos'
              ])
              .exec(function(err, venues) {
                // Set it
                inject.venues = venues;
                // Call done
                done();
              });
          },
          // Get favorite exhibitions
          function(done) {
            // Get favorites
            var favorites = user.toJSON().favorites;
            // If there's exhibitions
            if (favorites && favorites.exhibitions && favorites.exhibitions.length) {
              // Set today
              var today = moment();
              // Find exhibitions
              Exhibition.find({
                _id: {
                  $in: favorites.exhibitions
                }/*,
                endDate: {
                  $gte: today
                }*/
              }).sort('-startDate').deepPopulate([
                'artists',
                'gallery',
                  'gallery.photos',
                    'gallery.photos.photo',
              ]).exec(function(err, exhibitions) {
                // Set favorite exhibitions
                favoriteExhibitions = exhibitions;
                // Call done
                done();
              });
            } else {
              // Call done
              done();
            }
          }
        ], function() {
          // Show model
          api.showModel(res, err, user, inject, function(data) {
            // Set favorite exhibitions
            data.favorites.exhibitions = favoriteExhibitions;
          });
        });
      });
  },

  /**
   * Get favorite artists
   */
  favoriteArtists: function(req, res) {
    var filters = {};
    // If there are favorites
    if (req.token.user.favorites && req.token.user.favorites.artists) {
      // Set it
      filters._id = {
        $in: req.token.user.favorites.artists
      };
    }
    // Execute
    api.find(res, User, filters, null, req.query, []);
  },

  /**
   * Get favorite events
   */
  favoriteExhibitions: function(req, res) {
    var today = moment(), filters = { endDate: { $gte: today } }, favoritesCount = 0;

    // Check if there's favorites
    var hasFavorites = function(name) {
      // Has fave
      var hasFave = req.token && req.token.user && req.token.user.favorites && 
                    req.token.user.favorites[name] && req.token.user.favorites[name].length;
      // If there's fave
      if (hasFave) {
        // Increment count
        favoritesCount++;
      }
      // Return
      return hasFave;
    };

    // Or
    var or = [];

    // If there's exhibitions
    if (hasFavorites('exhibitions')) {
      // Add id
      or.push({ 
        _id: {
          $in: req.token.user.favorites.exhibitions
        }
      });
    }
    // If there's artists
    if (hasFavorites('artists')) {
      // Still or
      or.push({
        owner: {
          $in: req.token.user.favorites.artists
        }
      });
      or.push({
        'artists.user': {
          $in: req.token.user.favorites.artists
        }
      });
    }
    // If there's venues
    if (hasFavorites('venues')) {
      // Add venues
      or.push({
        venue: {
          $in: req.token.user.favorites.venues
        }
      });
    }

    // If there's any
    if (favoritesCount > 0) {
      // If there's or
      if (or.length) {
        // Add or
        filters.$or = or;
      }
      // Execute
      api.find(res, Exhibition, filters, null, req.query, [
        'artists',
          'artists.user',
        'gallery',
          'gallery.photos.photo',
          'gallery.photos.artists',
        'owner', 
        'venue',
          'venue.owner'
      ], null, {
        favorite: function(exhibition) {
          return (req.token && req.token.user) ? exhibition.isFavoriteOf(req.token.user) : false;
        },
        recommend: function(exhibition) {
          return (req.token && req.token.user) ? exhibition.isRecommendedBy(req.token.user) : false;
        }
      });
    } else {
      // Send empty
      api.json(res, {
        data: [],
        count: 0
      });
    }
  },

  /**
   * Get favorite venues
   */
  favoriteVenues: function(req, res) {
    var filters = {};
    // If there are favorites
    if (req.token.user.favorites && req.token.user.favorites.venues) {
      // Set it
      filters._id = {
        $in: req.token.user.favorites.venues
      };
    }
    // Execute
    api.find(res, Venue, filters, null, req.query, []);
  },

  /**
   * Create search
   */
  saveSearch: function(req, res) {
    // If no name or keyword
    if (!req.body.name) {
      return api.success(res, 'Name is required');
    }
    if (!req.body.keyword) {
      return api.success(res, 'Keyword is required');
    }
    if (!req.body.date) {
      return api.success(res, 'Date is required');
    }
    if (!req.body.city) {
      return api.success(res, 'City is required');
    }

    // Find if there's city with the same name
    Search.findOne({
      name: req.body.name
    }).exec(function(err, search) {

      if (search) {
        // Just update
        search.name = req.body.name;
        search.keyword = req.body.keyword;
        search.date = req.body.date;
        search.city = req.body.city;
      } else {
        // Create new search
        search = new Search({
          name: req.body.name,
          keyword: req.body.keyword,
          date: req.body.date,
          city: req.body.city,
          user: req.token.user._id
        });
      }
      // Save
      search.save(function(err, search) {
        // Respond
        api.success(res, 'Search saved successfully');
      });
      
    });
  },

  /**
   * Delete search
   */
  deleteSearch: function(req, res) {
    // Do delete
    Search.findOne({
      _id: req.params.id
    }).remove(function() {
      api.success(res, 'Search successfully deleted');
    });
  },

	/**
	 * Get all users
	 */
	index: function(req, res) {
    // Set filters
    var filters = {};
    // Loop through recognized filters
    ['name', 'username'].forEach(function(filter) {
      // If there's any
      if (req.query && req.query[filter]) {
        // search
        var search = new RegExp(req.query[filter], 'i');
        // Select filter
        switch (filter) {
          case 'name':
            // Create filter
            filters.$or = [
              { 'name.first': search },
              { 'name.last': search }
            ];
            break;
          case 'username':
            // Set username
            filters.username = search;
            break;
        }
      }
    });
    // Execute
    api.find(res, User, filters, null, req.query, []);
	},

  /**
   * Get all artists
   */
  find: function(req, res) {
    // Search
    var filters = {};
    // If there's q
    if (req.query.q) {
      // search
      var search = new RegExp(req.query.q, 'i');
      // Set filters
      filters = {
        $or: [
          {
            'name.first': search
          },
          {
            'name.last': search
          }
        ]
      };
    }
    // Execute
    api.find(res, User, filters, null, req.query, [
      'photo'
    ]);
  },

	/**
	 * Get single user
	 */
	show: function(req, res) {
		User.findOne({ username: req.params.username }, null, function(err, user) { 
      // Show model
      api.showModel(res, err, user);
		});
	},

  /**
   * Delete
   */
  delete: function(req, res) {
    // Find user
    User.findOne({ username: req.params.username }).remove(function(err) {
      // Deleted
      api.success(res, err ? 'User not found' : 'User successfully deleted');
    });
  },

  /**
   * Update single user
   */
  update: function(req, res) {
    // If there's no body
    if (!req.body.user) {
      // Exit
      api.json(res, {});
      return false;
    }
    // Find user
    User.findOne({ username: req.params.username }, null, function(err, user) {

      // Restrict
      var restrict = [
        '_id',
        '__v',
        'id',
        'email',
        'username',
        'password',
        'salt',
        'social',
        'updated',
        'created',
        'recommendations',
        'favorites'
      ];

      for (var i in req.body.user) {
        // If in restrict
        if (restrict.indexOf(i) >= 0) {
          // Skip
          continue;
        }
        // Set user
        user[i] = req.body.user[i];
      }
      // Save user
      user.save(function(err, user) {
        // If there's error
        if (err) {
          api.error(res, err);
        } else {
          api.json(res, user);
        }
      });

    });
  }

};