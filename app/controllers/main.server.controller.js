'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('./errors.server.controller'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User'),
  Venue = mongoose.model('Venue'),
  Exhibition = mongoose.model('Exhibition'),
  Setting = mongoose.model('Setting'),
  api = require('./api/exhibitions.server.controller'),
  config = require('../../config/config'),
  appRoot = require('app-root-path'),
  mkdirp = require('mkdirp'),
  fs = require('fs'),
  gm = require('gm');

var ltrim = function(str, charlist) {
  //  discuss at: http://phpjs.org/functions/ltrim/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //    input by: Erkekjetter
  // improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // bugfixed by: Onno Marsman
  //   example 1: ltrim('    Kevin van Zonneveld    ');
  //   returns 1: 'Kevin van Zonneveld    '

  charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
    .replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
  var re = new RegExp('^[' + charlist + ']+', 'g');
  return (str + '')
    .replace(re, '');
};

// Home
exports.home = function(req, res, extend) {
  // Get artcachetitle
  Setting.fetch('artCacheTitle', function(setting) {
    // Get all artCache
    api.exhibitions.getArtCache(function(err, response) {
      // Render
      res.render('layouts/main', _.extend({
        root: '',
        token: req.token || null,
        admin: (req.token && req.token.user && (req.token.user.roles.indexOf('admin') >= 0)) ? 'true' : 'false',
        lang: req.session.lang || null,
        artCacheTitle: setting.value,
        artCache: response.data,
        meta: [],
        year: (new Date()).getFullYear()
      }, extend || {}));
    });
  });
};

exports.index = function(req, res) {
  // Use home
  exports.home(req, res);
};

// Get social meta
var getSocialMeta = function(social, type, content) {
  // List
  var list = {
    facebook: {
      attribute: 'property',
      type: 'og:type',
      title: 'og:title',
      url: 'og:url',
      description: 'og:description',
      image: 'og:image',
    },
    twitter: {
      attribute: 'name',
      type: 'twitter:card',
      title: 'twitter:title',
      url: 'twitter:url',
      description: 'twitter:description',
      image: 'twitter:image'
    }
  };
  // Set meta tag
  var tag = {};
  // Set type
  tag[list[social].attribute] = list[social][type];
  tag.content = content;
  // Return the tag
  return tag;
};

// Get all meta
var getAllMeta = function(tags) {
  // Meta
  var meta = [];
  // Loop through social
  ['facebook', 'twitter'].forEach(function(social) {
    // If facebook
    if (social === 'facebook') {
      // Add app id
      meta.push({
        property: 'fb:app_id',
        content: config.facebook.clientID
      });
    }
    // Loop through tags
    ['type', 'title', 'url', 'description', 'image'].forEach(function(type) {
      // If type
      if (type === 'type') {
        // Set content
        switch (social) {
          case 'facebook':
            tags.type = 'website';
            break;
          case 'twitter':
            tags.type = 'summary';
            break;
        }
      }
      // Set tag
      meta.push(getSocialMeta(social, type, tags[type]));
    });
  });
  // Return meta
  return meta;
};

// Venue page
exports.venue = function(req, res) {
  // Load venue by permalink
  Venue.findOne({ permalink: (req.params.permalink || '').toLowerCase() })
    .deepPopulate([
      'owner',
      'album',
        'album.photos'
    ])
    .exec(function(err, venue) {
      // If there's no venue
      if (err || !venue) {
        // Use home
        exports.home(req, res);
      } else {

        var tags = {};
        // Set individual tags
        tags.title = venue.name;
        tags.description = venue.description;
        tags.url = config.url + '/venue/' + venue.permalink;

        // If there's image
        if (venue.album && venue.album.photos && venue.album.photos.length) {
          // Get first
          tags.image = config.url + '/' + ltrim(venue.album.photos[0].source, '/');
        }

        // Print with meta
        exports.home(req, res, { meta: getAllMeta(tags) });
      }
    });
};

// Exhibition page
exports.exhibition = function(req, res) {
  // Load exhibition by permalink
  Exhibition.findOne({ permalink: (req.params.permalink || '').toLowerCase() })
    .deepPopulate([
      'gallery',
        'gallery.photos.photo'
    ])
    .exec(function(err, exhibition) {
      // If there's no exhibition
      if (err || !exhibition) {
        // Use home
        exports.home(req, res);
      } else {
        var tags = {};
        // Set individual tags
        tags.title = exhibition.name;
        tags.description = exhibition.description;
        tags.url = config.url + '/event/' + exhibition.permalink;

        // If there's image
        if (exhibition.gallery && exhibition.gallery.photos && exhibition.gallery.photos.length) {
          // Get first
          tags.image = config.url + '/' + ltrim(exhibition.gallery.photos[0].photo.source, '/');
        }

        // Print with meta
        exports.home(req, res, { meta: getAllMeta(tags) });
      }
    });
};

// Artist page
exports.artist = function(req, res) {
  // Load artist by permalink
  User.findOne({ username: (req.params.username || '').toLowerCase() })
    .deepPopulate([
      'album',
        'album.photos'
    ])
    .exec(function(err, user) {
      // If there's no user
      if (err || !user) {
        // Use home
        exports.home(req, res);
      } else {
        var tags = {};
        // Set individual tags
        tags.title = user.name.full;
        tags.description = user.description;
        tags.url = config.url + '/artist/' + user.username;

        // If there's image
        if (user.album && user.album.photos && user.album.photos.length) {
          // Get first
          tags.image = config.url + '/' + ltrim(user.album.photos[0].source, '/');
        }

        // Print with meta
        exports.home(req, res, { meta: getAllMeta(tags) });
      }
    });
};

// Set language
exports.lang = function(req, res) {
  // Set lang
  req.session.lang = req.body.lang;
  // Set header
  res.header('Content-Type', 'text/json; charset=utf-8');
  res.send(JSON.stringify({ lang: req.session.lang }, null, 4));
};

var processThumb = function(req, res, art) {
  // Source
  var source = appRoot + (art ? '/public/images/art/' : ('/public/uploads/' + req.params.date)) + '/' + req.params.filename,
      targetRelativePath = '/uploads/' + (art ? 'images/art' : req.params.date) + '/thumbs/' + req.params.size + '/';

  var targetDir = appRoot + '/public' + targetRelativePath,
      target = targetDir + req.params.filename,
      targetPath = targetRelativePath + req.params.filename;

  // Get size
  var arrSize = (req.params.size || '').split('x'),
      size = {
        width: parseInt(arrSize[0] || 0),
        height: parseInt(arrSize[1] || 0)
      };
  // Redirect to blank
  var blank = function() {
    // Redirect to blank image
    res.redirect('/images/blank.gif');
  };
  // If both dimensions are 0
  if (!size.width && !size.height) {
    // Blank
    blank();
  } else {
    // Check if source exists
    fs.exists(source, function(exists) {
      // If not exists
      if (!exists) {
        // Blank
        blank();
      } else {
        // Load image
        var image = gm(source).quality(100);
        // Get size
        image.size(function(err, value) {
          // If there's err
          if (err) {
            // Blank
            blank();
          } else {

            // Get source ratio
            var ratio = value.width / value.height;
            // If there's no width
            if (!size.width) {
              // Base from height
              size.width = size.height * ratio;
            } else if (!size.height) {
              // Base from width
              size.height = size.width / ratio;
            }
            
            // Create directory first
            mkdirp(targetDir, function(err) {
              // If there's error
              if (err) {
                // Blank
                blank();
              } else {
                // Resize
                image.resize(size.width, size.height, '^')
                  .gravity('Center');
                // If there's width and height
                if (size.width !== size.height) {
                  // Do crop
                  image.crop(size.width, size.height);
                }
                // Write
                image.write(target, function(err) {
                  // If there's error
                  if (err) {
                    // Blank
                    blank();
                  } else {
                    // Redirect to target path
                    res.redirect(targetPath);
                  }
                });
              }
            });
          }
        });
      }
    });
  }
};

/**
 * Thumbnail
 */
exports.thumb = function(req, res) {
  // Process
  processThumb(req, res);
};

/**
 * Art thumbnail
 */
exports.thumbArt = function(req, res) {
  // Process
  processThumb(req, res, true);
};
