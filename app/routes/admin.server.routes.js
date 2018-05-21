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
	// User Routes
	var admin = require('../controllers/admin.server.controller');

	// Setting up the users profile api
	app.route('/admin').get([validateToken, admin.index]);
	app.route('/admin/:one').get([validateToken, admin.index]);
  app.route('/admin/:one/:two').get([validateToken, admin.index]);
  app.route('/admin/:one/:two/:three').get([validateToken, admin.index]);
  app.route('/admin/:one/:two/:three/:four').get([validateToken, admin.index]);
  app.route('/admin/:one/:two/:three/:four/:five').get([validateToken, admin.index]);

};
