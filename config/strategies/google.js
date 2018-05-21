'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
	config = require('../config'),
	mongoose = require('mongoose');

module.exports = function() {
	// Use google strategy
	passport.use(new GoogleStrategy({
			clientID: config.google.clientID,
			clientSecret: config.google.clientSecret,
			callbackURL: config.google.callbackURL,
			passReqToCallback: true
		},
		function(req, accessToken, refreshToken, profile, done) {
			// If there's no provider
			if (!profile.provider) {
				profile.provider = 'google';
			}
			// Find user by social
			mongoose.model('User').passportGetSocial(req, profile, done);
		}
	));
};
