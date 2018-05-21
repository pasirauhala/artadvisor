'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
    configToken = require('../../config/token');

/**
 * API use middleware
 */
var validateToken = function(req, res, next) {
  // API middleware should overwrite session route
  // If there's token
  if (req.session.token) {
    // Validate
    configToken.validate(req, req.session.token, function(token, valid, message) {
      // If there's token
      if (valid && token) {
        req.token = token;
      } else {
        req.token = null;
        req.session.token = '';
        console.log(message);
      }
      // Call next
      next();
    });
  } else {
    // Remove token
    req.token = null;
    next();
  }
};

module.exports = function(app) {
	// Main Routes
	var main = require('../controllers/main.server.controller');

	// Setting up the users profile api
	app.route('/').get([validateToken, main.index]);
  app.route('/authentication').get([validateToken, main.index]);
  app.route('/forgot-password').get([validateToken, main.index]);
  app.route('/settings').get([validateToken, main.index]);
  app.route('/feedback').get([validateToken, main.index]);
  app.route('/invite').get([validateToken, main.index]);
  app.route('/about-terms').get([validateToken, main.index]);
  app.route('/privacy-policy').get([validateToken, main.index]);
  app.route('/profile').get([validateToken, main.index]);
  app.route('/landing').get([validateToken, main.index]);
	app.route('/landing/:page').get([validateToken, main.index]);

  app.route('/venue/create').get([validateToken, main.index]);
  app.route('/venue/:permalink').get([validateToken, main.venue]);
  app.route('/venue/:permalink/edit').get([validateToken, main.index]);

  app.route('/event/create').get([validateToken, main.index]);
  app.route('/event/:permalink').get([validateToken, main.exhibition]);
  app.route('/event/:permalink/edit').get([validateToken, main.index]);
  
  app.route('/artist/:username').get([validateToken, main.artist]);

  app.route('/search').get([validateToken, main.index]);
  app.route('/map').get([validateToken, main.index]);

  // Set lang
  app.route('/lang').post([validateToken, main.lang]);

  app.route('/artcache').get([validateToken, main.index]);

  app.route('/404').get([validateToken, main.index]);

  // Image thumbnails route
  app.route('/uploads/:date/thumbs/:size/:filename').get([main.thumb]);
  app.route('/uploads/images/art/thumbs/:size/:filename').get([main.thumbArt]);

};
