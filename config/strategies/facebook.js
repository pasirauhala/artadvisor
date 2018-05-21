'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	FacebookStrategy = require('passport-facebook').Strategy,
	config = require('../config'),
	mongoose = require('mongoose');

module.exports = function() {
	// Use facebook strategy
	passport.use(new FacebookStrategy({
			clientID: config.facebook.clientID,
			clientSecret: config.facebook.clientSecret,
			callbackURL: config.facebook.callbackURL,
			profileFields: [
				'id', 
				'email', 
				'first_name', 
				'last_name',
			],
			passReqToCallback: true
		},
		function(req, accessToken, refreshToken, profile, done) {
			// If there's no provider
			if (!profile.provider) {
				profile.provider = 'facebook';
			}
			// Find user by social
			mongoose.model('User').passportGetSocial(req, profile, done);
		}
	));
};
