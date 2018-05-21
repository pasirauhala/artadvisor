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
  User = mongoose.model('User'),
  api = require('./helpers/api.server.helper');

exports.artists = {

  /**
   * Get all artists
   */
  index: function(req, res) {
    // Search
    var filters = {
      profileType: 'artist'
    };
    // If there's q
    if (req.query.q) {
      // Set to query
      req.query.name = req.query.q;
    }
    
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
    api.find(res, User, filters, null, req.query, [
      'photo'
    ]);
  },

  /**
   * List
   */
  list: function(req, res) {
    // Search
    var filters = {
      profileType: 'artist'
    };
    // Execute
    api.find(res, User, filters, 'profileType name photo', { limit: 10000 }, [
      'photo'
    ]);
  },

  /**
   * Get artist
   */
  getOne: function(username, found) {
    // Find by username
    User.findOne({ username: username.toLowerCase(), profileType: 'artist' })
      .deepPopulate([
        'photo', 
        'album', 
          'album.photos', 
            'album.photos.artists',
              'album.photos.artists.photo'])
      .exec(found);
  },

  /**
   * Get single artist
   */
  show: function(req, res) {
    // Get
    exports.artists.getOne(req.params.username, function(err, user) { 
      // If error
      if (err || !user) {
        res.json({});
      } else {
        // Get exhibitions
        Exhibition.find({ 
          'artists.user': user._id,
          additional: false
        })
          .deepPopulate([
            'owner',
            'gallery',
              'gallery.photos.photo',
                'gallery.photos.artists'
          ])
          .exec(function(err, exhibitions) {
            // Show model
            api.showModel(res, err, user, {
              exhibitions: exhibitions,
              favorite: (req.token && 
                          req.token.user && 
                          user._id && 
                          user.isFavoriteOf(req.token.user)),
              recommend: (req.token && 
                          req.token.user && 
                          user._id && 
                          user.isRecommendedBy(req.token.user))
            });
          });
      }
    });
  },

  /**
   * Delete
   */
  delete: function(req, res) {
    // Find user
    User.findOne({ username: req.params.username, profileType: 'artist' }).remove(function(err) {
      // Deleted
      api.success(res, err ? 'Artist not found' : 'Artist successfully deleted');
    });
  },

  /**
   * Favorite
   */
  favorite: function(req, res) {
    // Get
    exports.artists.getOne(req.params.username, function(err, user) {
      // If error
      if (err || !user) {
        res.json({ });
      } else {
        req.token.user.favorite(user, function() {
          api.success(res, 'Artist succesfully favorited');
        });
      }
    });
  },

  /**
   * Remove favorite
   */
  unfavorite: function(req, res) {
    // Get
    exports.artists.getOne(req.params.username, function(err, user) {
      // If error
      if (err || !user) {
        res.json({ });
      } else {
        req.token.user.unfavorite(user, function() {
          api.success(res, 'Artist succesfully unfavorited');
        });
      }
    });
  },

  /**
   * Recommend
   */
  recommend: function(req, res) {
    // Get
    exports.artists.getOne(req.params.username, function(err, user) {
      // If error
      if (err || !user) {
        res.json({ });
      } else {
        req.token.user.recommend(user, function() {
          api.success(res, 'Artist succesfully recommended');
        });
      }
    });
  },

  /**
   * Remove recommend
   */
  unrecommend: function(req, res) {
    // Get
    exports.artists.getOne(req.params.username, function(err, user) {
      // If error
      if (err || !user) {
        res.json({ });
      } else {
        req.token.user.unrecommend(user, function() {
          api.success(res, 'Artist succesfully unrecommended');
        });
      }
    });
  },

  /**
   * Get comments
   */
  getComments: function(req, res) {
    // Get
    User.findOne({ username: req.params.username }).exec(function(err, user) {
      // If error
      if (err || !user) {
        res.json({ });
      } else {
        // Set filters
        var filters = {
          artist: user._id
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
          artist: user._id
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
    User.findOne({ username: req.params.username }).exec(function(err, user) {
      // If error
      if (err || !user) {
        res.json({ });
      } else {
        // Create new comment
        var comment = new Comment({
          content: req.body.content,
          artist: user._id,
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
    User.findOne({ username: req.params.username }).exec(function(err, artist) {
      // If error
      if (err || !artist) {
        res.json({ });
      } else {
        // Create new comment
        var comment = new Comment({
          content: req.body.content,
          artist: artist._id,
          owner: req.token.user._id
        });

        // Get comment by id
        Comment.findOne({ _id: req.params.id }).remove().exec(function(err) {
          // Done
          res.json({ });
        });
      }
    });
  }


};