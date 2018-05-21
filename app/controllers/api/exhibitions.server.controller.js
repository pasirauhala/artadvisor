'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  Comment = mongoose.model('Comment'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),
  User = mongoose.model('User'),
  Gallery = mongoose.model('Gallery'),
  Photo = mongoose.model('Photo'),
  Setting = mongoose.model('Setting'),
  api = require('./helpers/api.server.helper'),
  str = require('./helpers/str.server.helper'),
  moment = require('moment'),
  async = require('async'),
  City = mongoose.model('City'),
  venuesApi = require('./location.server.controller').venues,
  q = require('q');

exports.exhibitions = {

  /**
   * Get all exhibitions
   */
  index: function(req, res) {
    // User
    var user = (req.token && req.token.user) ? req.token.user : null;
    // Find
    var findExhibitions = function(venues) {
      // Get today
      var today = moment().utc().startOf('day');

      // Set filters
      var filters = {
        additional: false
      }, callbacks = [];

      if (_.isArray(venues)) {
        // Set filters
        filters.venue = {
          $in: venues
        };
      }

      // If there's date
      if (req.query.date) {
        // Set date
        var date = null;
        // Select
        switch (req.query.date) {
          case 'today':
            date = today;
            break;
          default:
            date = moment(req.query.date);
            break;
        }
        // Set date
        filters.startDate = {
          $lte: date
        };
        filters.endDate = {
          $gte: date
        };
      }

      // If there's landing
      if (req.query.landing) {
        // Select
        switch (req.query.landing.toLowerCase()) {
          // Now
          case 'now':
            // Set date
            filters.startDate = {
              $lte: today.clone().add(1, 'day')
            };
            filters.endDate = {
              $gte: today.clone().subtract(1, 'day')
            };

            filters.coordinates = {
              $near: (req.query.near || '').split(','),
              // $maxDistance: 20 / 111.12 // 20 kilometers
            };
            req.query.sort = null;

            break;
          // Last Chance
          case 'lastchance':
            // Get current
            var yesterday = today.clone().subtract(1, 'day'),
                afterSevenDays = today.clone().add(7, 'days');
            // Set date filter
            delete filters.startDate;
            filters.endDate = {
              $gte: yesterday,
              $lte: afterSevenDays
            };
            break;
        }
      }

      // Loop through recognized filters
      ['name', 'description', 'artist', 'venue'].forEach(function(filter) {
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
            case 'description':
              // Set description
              filters.description = search;
              break;
            case 'artist':
              // Create a callback
              callbacks.push(function(done) {
                // Search for user first
                User.find({
                  profileType: 'artist',
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

                  filters.$or = [
                    { 'artists.user': { $in: ids } },
                    { 'artists.nonUser.fullname': search }
                  ];
                  // Call done
                  done();
                });
              });
              break;
            case 'venue':
              // Create a callback
              callbacks.push(function(done) {
                // Search venue
                Venue.find({
                  name: search
                }).exec(function(err, venues) {
                  // Ids
                  var ids = [];
                  // Loop through venues
                  (venues || []).forEach(function(venue) {
                    // Add id
                    ids.push(venue.id || venue._id);
                  });
                  // Set it
                  filters.venue = {
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

      // console.log(filters);

      // Execute all first
      async.parallel(callbacks, function() {
        // Do find
        var doFind = function(inject) {
          // Execute
          api.find(res, Exhibition, filters, null, req.query, [
            'artists.user',
              'artists.user.photo',
            'gallery',
              'gallery.photos.photo',
              'gallery.photos.artists',
                'gallery.photos.artists.photo',
            'owner', 
            'venue',
              'venue.owner'
          ], inject || null, {
            owned: function(exhibition) {
              if (!exhibition || !exhibition._id || !exhibition.owner || !exhibition.owner._id) {
                return false;
              }

              return user && ((user._id.toString() === exhibition.owner._id.toString()) || 
                              exhibition.isOwner(user) ||
                              (user.roles.indexOf('admin') >= 0));
            },
            favorite: function(exhibition) {
              if (!exhibition || !exhibition._id) {
                return false;
              }
              return user ? exhibition.isFavoriteOf(user) : false;
            },
            recommend: function(exhibition) {
              if (!exhibition || !exhibition._id) {
                return false;
              }
              return user ? exhibition.isRecommendedBy(user) : false;
            }
          });
        };

        // If start is 0
        if (parseInt(req.query.start || null) === 0) {
          // Find cities first
          Exhibition.find(_.omit(filters, ['venue']), '_id venue')
            .deepPopulate([
              'venue'
            ])
            .exec(function(err, exhibitions) {
            // All cities
            var cities = [];
            // Loop through exhibitions
            (exhibitions || []).forEach(function(exhibition) {
              // If ascii isn't added yet
              if (cities.indexOf(exhibition.venue.address.ascii) < 0) {
                // Add
                cities.push(exhibition.venue.address.ascii);
              }
            });
            // Do find
            doFind({
              cities: cities
            });
          });
        } else {
          // Just find
          doFind();
        }

      });
    };

    // Find venue first
    var hasCoords = req.query.sw && req.query.ne,
        hasCity = !!(req.query.city || ''),
        findVenuesFirst = [],
        venueFilters = {};

    if (hasCoords) {
      // Split
      var sw = req.query.sw.split(','),
          ne = req.query.ne.split(',');

      // Get south
      var south = parseFloat(sw[0]),
          west = parseFloat(sw[1]),
          north = parseFloat(ne[0]),
          east = parseFloat(ne[1]);

      var hasCoordsDeffered = q.defer();
      // Set coords
      venueFilters['address.coordinates.latitude'] = {
        $gte: south,
        $lte: north
      };
      venueFilters['address.coordinates.longitude'] = {
        $gte: west,
        $lte: east
      };
      // Resolve
      hasCoordsDeffered.resolve(venueFilters);
      // ADd to promises
      findVenuesFirst.push(hasCoordsDeffered.promise);
    }

    if (hasCity) {
      // Promise
      var hasCityDeffered = q.defer();
      // Find matching city
      City.findOne({
        lcase: (req.query.city || '').toLowerCase()
      }).exec(function(err, city) {
        // If there's any
        if (!err && city) {
          // Set filter
          venueFilters['address.city'] = city.name;
        }
        // Resolve
        hasCityDeffered.resolve(venueFilters);
      });
      // Add promise
      findVenuesFirst.push(hasCityDeffered.promise);
    }

    if (findVenuesFirst.length) {
      // Do first
      q.all(findVenuesFirst).then(function() {
        // Find venues
        Venue.find(venueFilters, function(err, venues) {
          // Get all ids
          var ids = [];
          if (venues) {
            for (var i in venues) {
              ids.push(venues[i]._id);
            }
          }
          findExhibitions(ids);
        });
      });
    } else {
      // Just find
      findExhibitions();
    }

  },

  /**
   * Get single exhibition
   */
  show: function(req, res) {
    // User
    var user = (req.token && req.token.user) ? req.token.user : null;

    // Find by permalink
    Exhibition.findOne({ permalink: req.params.permalink.toLowerCase() })
      .deepPopulate([
        'artists.user',
          'artists.user.photo',
        'gallery',
          'gallery.photos.photo',
          'gallery.photos.artists',
            'gallery.photos.artists.photo',
        'owner', 
        'venue',
          'venue.owner'
      ])
      .exec(function(err, exhibition) { 

        if (err || !exhibition) {
          api.json(res, {});
        } else {
          // Owned
          var owned = user && ((exhibition.owner && exhibition.owner._id.toString() === user._id.toString()) ||
                              exhibition.isOwner(user) ||
                              (user.roles.indexOf('admin') >= 0));

          // Show model
          api.showModel(res, err, exhibition, {
            // Owned
            owned: owned,
            favorite: (user && 
                        exhibition._id && 
                        exhibition.isFavoriteOf(user)),
            recommend: (user && 
                        exhibition._id && 
                        exhibition.isRecommendedBy(user)),

            // now: (new Date()).getTimezoneOffset()

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
      name: req.body.name || '',
      description: req.body.description || '',
      admissionFee: req.body.admissionFee || 'free',
      openingHours: req.body.openingHours || [],
      specialHours: req.body.specialHours || [],
      openByAppointment: !!req.body.openByAppointment,
      // writtenInMedia: req.body.writtenInMedia || '',
      genres: req.body.genres || []
    };

    var required = [
      { value: inputs.name, message: 'Event name is required' },
      { value: inputs.description, message: 'Information is required' },
      { value: inputs.admissionFee, message: 'Admission fee is required' }
    ];

    // Make sure required inputs are set
    for (var i in required) {
      if (!required[i].value) {
        // Set error
        return api.success(res, required[i].message, true);
      }
    }

    // Require venue
    if (!req.body.venue || !req.body.venue[0] || !req.body.venue[0]._id) {
      // Error
      return api.success(res, 'Venue is required', true);
    }
    // Require artists
    if (!req.body.artists || req.body.artists.length === 0) {
      // Error
      return api.success(res, 'Event must have at least 1 artist', true);
    }
    // Require dates
    if (!req.body.dates) {
      // Error
      return api.success(res, 'Dates are required', true);
    }

    /**
     * Parse date here
     */

    // Split dates
    var dates = req.body.dates.split('-');

    if (dates.length < 2) {
      return api.success(res, 'Invalid dates range', true);
    }
    
    var startDate = moment(dates[0], 'DD.MM.YYYY'),
        endDate = moment(dates[1], 'DD.MM.YYYY');

    if (!startDate.isValid()) {
      return api.success(res, 'Invalid start date', true);
    }
    if (!endDate.isValid()) {
      return api.success(res, 'Invalid end date', true);
    }

    inputs.startDate = startDate;
    inputs.endDate = endDate;

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
      return api.success(res, 'Must have at least 1 photo for the event', true);
    }
    // Require genre
    if (!inputs.genres || !inputs.genres.length) {
      // Error
      return api.success(res, 'Must have at least 1 genre for the event', true);
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

    // Set artists
    inputs.artists = [];
    // Loop
    for (var k in req.body.artists) {
      // Make sure there's artist
      if (req.body.artists[k]._id) {
        // Create artist
        var artist = {
          user: null,
          nonUser: {
            fullname: ''
          }
        };

        if (req.body.artists[k].guest) {
          // Set fullname
          artist.nonUser.fullname = req.body.artists[k].fullname;
        } else {
          // Set artist
          artist.user = req.body.artists[k]._id;
        }
        // Push artist
        inputs.artists.push(artist);
      }
    }
    
    // Set venue
    inputs.venue = req.body.venue[0]._id;

    // Set owner
    inputs.owner = req.token.user._id;
    
    // Generate permalink first
    Exhibition.generatePermalink(inputs.name, function(permalink, permalinkSafe) {
      // Set permalink
      inputs.permalink = permalink;
      inputs.permalinkSafe = permalinkSafe;

      // Create exhibition
      var exhibition = new Exhibition(inputs);
      // Save
      exhibition.save(function(err, exhibition) {

        // Just create gallery
        var gallery = new Gallery({
          title: '',
          exhibition: exhibition._id
        });

        // Save
        gallery.save(function(err, gallery) {
          // Update photos
          gallery.updatePhotos(req.body.photos || [], function() {

            // Set gallery
            exhibition.gallery = gallery._id;
            // Save
            exhibition.save(function(err, exhibition) {
              // Print
              api.data(res, exhibition);
            });

          });
        });
      });
    });

  },

  updateExhibition: function(req, res, customFilter, noPermalink) {

    // If there's no custom filter
    if (!customFilter) {
      // Set it
      customFilter = { 
        permalink: req.params.permalink.toLowerCase() 
      };
    }

    // Find by permalink
    Exhibition.findOne(customFilter)
      // Execute search
      .exec(function(err, exhibition) { 
        // If nothing
        if (!exhibition) {
          // Not found
          api.error(res, 400);
          return false;
        }
        // Set updateable
        exhibition.name = req.body.name || exhibition.name;
        exhibition.description = req.body.description || exhibition.description;
        exhibition.admissionFee = req.body.admissionFee || exhibition.admissionFee;
        exhibition.openByAppointment = !!req.body.openByAppointment;

        var openingHours = req.body.openingHours || [],
            specialHours = req.body.specialHours || [];

        // exhibition.writtenInMedia = req.body.writtenInMedia || exhibition.writtenInMedia;
        exhibition.genres = req.body.genres || exhibition.genres || [];

        var required = [
          { value: exhibition.name, message: 'Event name is required' },
          { value: exhibition.description, message: 'Information is required' },
          { value: exhibition.admissionFee, message: 'Admission fee is required' }
        ];

        // Make sure required inputs are set
        for (var i in required) {
          if (!required[i].value) {
            // Set error
            return api.success(res, required[i].message, true);
          }
        }

        // Require artists
        if (!req.body.artists || req.body.artists.length === 0) {
          // Error
          return api.success(res, 'Event must have at least 1 artist', true);
        }
        // Require venue
        if (!req.body.venue || !req.body.venue[0] || !req.body.venue[0]._id) {
          // Error
          return api.success(res, 'Venue is required', true);
        }

        // Require dates
        if (!req.body.dates) {
          // Error
          return api.success(res, 'Dates are required', true);
        }

        /**
         * Parse date here
         */

        // Split dates
        var dates = req.body.dates.split('-');

        if (dates.length < 2) {
          return api.success(res, 'Invalid dates range', true);
        }
        
        var startDate = moment(dates[0], 'DD.MM.YYYY'),
            endDate = moment(dates[1], 'DD.MM.YYYY');

        if (!startDate.isValid()) {
          return api.success(res, 'Invalid start date', true);
        }
        if (!endDate.isValid()) {
          return api.success(res, 'Invalid end date', true);
        }

        // Check if end date is less
        if (endDate.diff(startDate) < 0) {
          return api.success(res, 'End date must be after start date');
        }

        exhibition.startDate = startDate;
        exhibition.endDate = endDate;

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
          return api.success(res, 'Must have at least 1 photo for the event', true);
        }
        // Require genre
        if (!exhibition.genres || !exhibition.genres.length) {
          // Error
          return api.success(res, 'Must have at least 1 genre for the event', true);
        }

        // Set to model
        exhibition.openingHours = openingHours;
        exhibition.specialHours = specialHours;

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
          exhibition.links = links;
        }

        // Set artists
        exhibition.artists = [];
        // Loop
        for (var k in req.body.artists) {
          // Make sure there's artist
          if (req.body.artists[k]._id) {
            // Create artist
            var artist = {
              user: null,
              nonUser: {
                fullname: ''
              }
            };

            if (req.body.artists[k].guest) {
              // Set fullname
              artist.nonUser.fullname = req.body.artists[k].fullname;
            } else {
              // Set artist
              artist.user = req.body.artists[k]._id;
            }
            // Push artist
            exhibition.artists.push(artist);
          }
        }
        
        // Set venue
        exhibition.venue = req.body.venue[0]._id;

        // Update gallery
        var updateGallery = function(gallery) {
          // Just update
          gallery.updatePhotos(req.body.photos || [], function(gallery) {
            // Respond
            api.data(res, exhibition);
          });
        };

        // Save
        var saveExhibition = function() {
          // Save
          exhibition.save(function(err, exhibition) {

            // Check if there's no gallery
            if (!exhibition.gallery) {
              // Create a gallery
              var gallery = new Gallery({
                title: '',
                exhibition: exhibition._id
              });
              gallery.save(function(err, gallery) {
                // Set exhibition gallery
                exhibition.gallery = gallery._id;
                exhibition.save(function(err, exhibition) {
                  // Update
                  updateGallery(gallery);
                });
              });
            } else {
              // Get gallery
              Gallery.findOne({ _id: (exhibition.gallery._id || exhibition.gallery) })
                .deepPopulate(['exhibition'])
                .exec(function(err, gallery) {
                // Update
                updateGallery(gallery);
              });
            }
          });
        };

        if (!noPermalink) {
          // Change permalink
          Exhibition.generatePermalink(exhibition.name, function(permalink, permalinkSafe) {
            // If permalink is not the same
            if (exhibition.permalinkSafe !== permalinkSafe) {
              // Change
              exhibition.permalink = permalink;
              exhibition.permalinkSafe = permalinkSafe;
            }
            // Save
            saveExhibition();
          });
        } else {
          // Just save right away
          saveExhibition();
        }

      });
  },

  /**
   * Update
   */
  update: function(req, res) {
    // Return
    return exports.exhibitions.updateExhibition(req, res);
  },

  /**
   * Delete
   */
  delete: function(req, res) {
    // User
    var user = (req.token && req.token.user) ? req.token.user : null;
    // Find by permalink
    Exhibition.findOne({ permalink: req.params.permalink.toLowerCase() })
      .deepPopulate(['owner'])
      .exec(function(err, exhibition) { 

      // If nothing
      if (!exhibition) {
        // Not found
        api.error(res, 400);
        return false;
      }
      // Owned
      var owned = user && ((exhibition.owner && exhibition.owner._id.toString() === user._id.toString()) ||
                          exhibition.isOwner(user) ||
                          (user.roles.indexOf('admin') >= 0));
      // If not owned
      if (!owned) {
        // Error
        api.error(res, 400);
      }
      // Delete
      Exhibition.findOne({ _id: exhibition._id.toString() }).remove(function(err) {
        // Success
        api.success(res, 'Event successfully deleted');
      });
    });
  },

  /**
   * Favorite
   */
  favorite: function(req, res) {
    // Get
    Exhibition.findOne({ permalink: req.params.permalink }).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        req.token.user.favorite(exhibition, function() {
          api.success(res, 'Event succesfully favorited');
        });
      }
    });
  },

  /**
   * Remove favorite
   */
  unfavorite: function(req, res) {
    // Get
    Exhibition.findOne({ permalink: req.params.permalink }).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        req.token.user.unfavorite(exhibition, function() {
          api.success(res, 'Event succesfully unfavorited');
        });
      }
    });
  },

  /**
   * Recommend
   */
  recommend: function(req, res) {
    // Get
    Exhibition.findOne({ permalink: req.params.permalink }).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        req.token.user.recommend(exhibition, function() {
          api.success(res, 'Event succesfully recommended');
        });
      }
    });
  },

  /**
   * Remove recommend
   */
  unrecommend: function(req, res) {
    // Get
    Exhibition.findOne({ permalink: req.params.permalink }).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        req.token.user.unrecommend(exhibition, function() {
          api.success(res, 'Event succesfully unrecommended');
        });
      }
    });
  },

  /**
   * Get comments
   */
  getComments: function(req, res) {

    var filt = {};
    if (req.params.permalink) {
      filt = { permalink: req.params.permalink };
    } else if (req.params.id) {
      filt = { _id: req.params.id };
    } else {
      filt = { permalink: '---' };
    }

    // Get
    Exhibition.findOne(filt).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        // Set filters
        var filters = {
          exhibition: exhibition._id
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
          exhibition: exhibition._id 
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

    var filt = {};
    if (req.params.permalink) {
      filt = { permalink: req.params.permalink };
    } else if (req.params.id) {
      filt = { _id: req.params.id };
    } else {
      filt = { permalink: '---' };
    }

    // Get
    Exhibition.findOne(filt).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        // Create new comment
        var comment = new Comment({
          content: req.body.content,
          exhibition: exhibition._id,
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

    var filt = {};
    if (req.params.permalink) {
      filt = { permalink: req.params.permalink };
    } else if (req.params.id) {
      filt = { _id: req.params.id };
    } else {
      filt = { permalink: '---' };
    }
    
    // Get
    Exhibition.findOne(filt).exec(function(err, exhibition) {
      // If error
      if (err || !exhibition) {
        res.json({ });
      } else {
        // Create new comment
        var comment = new Comment({
          content: req.body.content,
          exhibition: exhibition._id,
          owner: req.token.user._id
        });

        // Get comment by id
        Comment.findOne({ _id: req.params.id }).remove().exec(function(err) {
          // Done
          res.json({ });
        });
      }
    });
  },

  getArtCache: function(done, query) {
    // Do query
    api.query(done, Exhibition, { additional: true }, null, query || {}, [
      'artists.user',
        'artists.user.photo',
      'gallery',
        'gallery.photos.photo',
        'gallery.photos.artists',
          'gallery.photos.artists.photo',
      'owner', 
      'venue',
        'venue.owner'
    ]);
  },

  /**
   * ArtCache
   */
  showArtCache: function(req, res) {

    var artCacheTitle = 'Art Cache Helsinki';

    exports.exhibitions.getArtCache(function(err, response) {

      if (!response.count) {
        // Create
        var exhibition = new Exhibition({
          name: artCacheTitle,
          additional: true,
          title: artCacheTitle
        });
        // Create
        exhibition.save(function(err, exhibition) {
          // Print
          api.json(res, {
            count: 1,
            data: [exhibition]
          });
        });

        // Save setting
        Setting.fetch('artCacheTitle', function(setting) {
          // Change
          setting.value = artCacheTitle;
          // Save
          setting.save();
        });
      } else {
        api.json(res, response);
      }

    }, req.query);

  },

  /**
   * Update artcache
   */
  updateArtCache: function(req, res) {

    var artCacheTitle = 'Art Cache Helsinki';

    // Save setting
    Setting.fetch('artCacheTitle', function(setting) {
      // Change
      setting.value = artCacheTitle;
      // Save
      setting.save();
    });

    // Return
    return exports.exhibitions.updateExhibition(req, res, {
      _id: req.params.id,
      additional: true
    }, true);
  },

  /**
   * Schedules
   */
  schedules: function(req, res) {
    // Get start and end
    var start = moment(req.query.start),
        end = moment(req.query.end);
    // Get all exhibitions that fall within the date range
    Exhibition.find({
      $or: [
        {
          startDate: {
            $gte: start,
            $lt: end
          }
        },
        {
          endDate: {
            $gte: start,
            $lt: end
          }
        }
      ]
    }, 'id name startDate endDate').exec(function(err, exhibitions) {
      // Print exhibitions
      api.json(res, exhibitions);
    });
  }

};