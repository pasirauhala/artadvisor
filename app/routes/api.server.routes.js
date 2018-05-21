'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
		multer = require('multer'),
		api = require('../controllers/api/helpers/api.server.helper'),
		configToken = require('../../config/token');

/**
 * API use middleware
 */
var validateToken = function(req, res, next) {
	// API middleware should overwrite session route
	// If there's token
	if (req.query.token) {
		// Validate
		configToken.validate(req, req.query.token, function(token, valid, message) {
			// Set token to req
			req.token = (valid && token) ? token : null;
			// Set token is validated
			req.tokenValidated = true;
			// Call next
			next();
		});
	} else {
		// Remove token
		req.token = null;
		// Set token is validated
		req.tokenValidated = true;
		next();
	}
};

/**
 * Require token
 */
var requireToken = function(req, res, next) {
	// Check if token is not validated
	if (!req.tokenValidated) {
		// Validate token first
		validateToken(req, res, function() {
			// Require token again, but this time it will have a validated token
			requireToken(req, res, next);
		});
		return false;
	}
	// Check if there's no token
	if (!req.token) {
		// Error code 101 is invalid token, 102, is token required
		api.error(res, req.query.token ? 201 : 202);
		return false;
	}
	// Call next
	next();
};

/**
 * Require admin
 */
var requireAdmin = function(req, res, next) {
	// If no token
	if (!req.tokenValidated) {
		// Validate first
		validateToken(req, res, function() {
			// Call admin
			requireAdmin(req, res, next);
		});
		return false;
	}
	// If there's still no token
	if (!req.token || !req.token.user || !req.token.user.roles) {
		// Error code 101 is invalid token, 102, is token required
		api.error(res, req.query.token ? 201 : 202);
		return false;
	}
	// Check if user is admin
	if (req.token.user.roles.indexOf('admin') < 0) {
		// Error
		api.error(res, 203);
		return false;
	}
	// Next
	next();
};

module.exports = function(app) {
	// User Routes
	var api = require('../controllers/api.server.controller');

	// Authenticate
	app.route('/api/authenticate').post([api.authenticate.index]);
	// Facebook login
	app.route('/api/authenticate/facebook').post([api.authenticate.flashNext, passport.authenticate('facebook', { scope: ['email'] })]);
	app.route('/api/authenticate/facebook').get([passport.authenticate('facebook', {}), api.authenticate.facebook]);
	// Google login
	app.route('/api/authenticate/google').post([api.authenticate.flashNext, passport.authenticate('google', { scope: ['email'] })]);
	app.route('/api/authenticate/google').get([passport.authenticate('google', {}), api.authenticate.google]);
	// Sign out
	app.route('/api/authenticate/logout').delete([validateToken, api.authenticate.logout]);
	app.route('/api/authenticate/passwordreset').post([api.authenticate.passwordreset]);
	// Registration
	app.route('/api/register').post([api.register.index]);

	// Feedback
	app.route('/api/feedback').post([validateToken, api.miscellaneous.feedback]);
	// Report
	app.route('/api/report').post([validateToken, api.miscellaneous.report]);
	// Invite
	app.route('/api/invite').post([validateToken, api.miscellaneous.invite]);

	// Currently logged in user
	app.route('/api/me').get([requireToken, api.users.me]);
	app.route('/api/me').put([requireToken, api.users.updateMe]);
	app.route('/api/me').delete([requireToken, api.users.deleteMe]);
	// Update username
	app.route('/api/me/username').put([requireToken, api.users.username]);
	// Update password
	app.route('/api/me/password').put([requireToken, api.users.password]);
	// Update email
	app.route('/api/me/email').put([requireToken, api.users.email]);
	// Update photo
	app.route('/api/me/photo').put([requireToken, api.users.photo]);
	// Insert photo
	app.route('/api/me/photo').post([requireToken, api.users.createPhoto]);
	// Update single photo in album
	app.route('/api/me/photo/:id').put([requireToken, api.users.updatePhoto]);
	// Delete single photo from album
	app.route('/api/me/photo/:id').delete([requireToken, api.users.deletePhoto]);
	// Saved searches
	app.route('/api/me/searches').get([requireToken, api.users.searches]);
	app.route('/api/me/searches').post([requireToken, api.users.saveSearch]);
	app.route('/api/me/searches/:id').delete([requireToken, api.users.deleteSearch]);
	// Profile
	app.route('/api/me/profile').get([requireToken, api.users.profile]);
	// Favorites
	app.route('/api/me/favorites/artists').get([requireToken, api.users.favoriteArtists]);
	app.route('/api/me/favorites/events').get([requireToken, api.users.favoriteExhibitions]);
	app.route('/api/me/favorites/venues').get([requireToken, api.users.favoriteVenues]);
	// Unlink social
	app.route('/api/me/social/:social').delete([requireToken, api.users.unlinkSocial]);

	// Summary
	app.route('/api/summary').get([validateToken, api.miscellaneous.summary]);

	// Setting up the users profile api
	app.route('/api/users').get([validateToken, api.users.index]);
	app.route('/api/users/find').get([validateToken, api.users.find]);
	app.route('/api/users/:username').get([validateToken, api.users.show]);
	app.route('/api/users/:username').delete([validateToken, api.users.delete]);

	// Require admin
	app.route('/api/users/:username').put([requireAdmin, api.users.update]);

	app.route('/api/artists').get([validateToken, api.artists.index]);
	app.route('/api/artists/list').get([validateToken, api.artists.list]);
	app.route('/api/artists/:username').get([validateToken, api.artists.show]);
	app.route('/api/artists/:username').delete([validateToken, api.artists.delete]);

	app.route('/api/artists/:username/favorite').post([requireToken, api.artists.favorite]);
	app.route('/api/artists/:username/favorite').delete([requireToken, api.artists.unfavorite]);

	app.route('/api/artists/:username/recommend').post([requireToken, api.artists.recommend]);
	app.route('/api/artists/:username/recommend').delete([requireToken, api.artists.unrecommend]);

	app.route('/api/artists/:username/comments').get([validateToken, api.artists.getComments]);
	app.route('/api/artists/:username/comments').post([requireToken, api.artists.postComment]);
	app.route('/api/artists/:username/comments/:id').delete([requireToken, api.artists.deleteComment]);

	app.route('/api/venues').get([validateToken, api.venues.index]);
	app.route('/api/venues').post([requireToken, api.venues.create]);
	// Others
	app.route('/api/venues/cities').get([api.venues.cities]);
	app.route('/api/venues/refresh').get([api.venues.refresh]);
	
	app.route('/api/venues/:permalink').get([validateToken, api.venues.show]);
	app.route('/api/venues/:permalink').put([requireToken, api.venues.update]);
	app.route('/api/venues/:permalink').delete([requireToken, api.venues.delete]);

	app.route('/api/venues/:permalink/favorite').post([requireToken, api.venues.favorite]);
	app.route('/api/venues/:permalink/favorite').delete([requireToken, api.venues.unfavorite]);

	app.route('/api/venues/:permalink/recommend').post([requireToken, api.venues.recommend]);
	app.route('/api/venues/:permalink/recommend').delete([requireToken, api.venues.unrecommend]);

	app.route('/api/venues/:permalink/comments').get([validateToken, api.venues.getComments]);
	app.route('/api/venues/:permalink/comments').post([requireToken, api.venues.postComment]);
	app.route('/api/venues/:permalink/comments/:id').delete([requireToken, api.venues.deleteComment]);

	app.route('/api/events').get([validateToken, api.exhibitions.index]);
	app.route('/api/events').post([requireToken, api.exhibitions.create]);
	// Schedules
	app.route('/api/events/schedules').get([api.exhibitions.schedules]);

	app.route('/api/events/:permalink').get([validateToken, api.exhibitions.show]);
	app.route('/api/events/:permalink').put([requireToken, api.exhibitions.update]);
	app.route('/api/events/:permalink').delete([requireToken, api.exhibitions.delete]);
	
	app.route('/api/events/:permalink/favorite').post([requireToken, api.exhibitions.favorite]);
	app.route('/api/events/:permalink/favorite').delete([requireToken, api.exhibitions.unfavorite]);
	
	app.route('/api/events/:permalink/recommend').post([requireToken, api.exhibitions.recommend]);
	app.route('/api/events/:permalink/recommend').delete([requireToken, api.exhibitions.unrecommend]);

	app.route('/api/events/:permalink/comments').get([validateToken, api.exhibitions.getComments]);
	app.route('/api/events/:permalink/comments').post([requireToken, api.exhibitions.postComment]);
	app.route('/api/events/:permalink/comments/:id').delete([requireToken, api.exhibitions.deleteComment]);

	app.route('/api/galleries').post([validateToken, api.galleries.index]);
	app.route('/api/galleries/:permalink').get([validateToken, api.galleries.show]);

	// Search
	app.route('/api/search').get([validateToken, api.search.index]);
	app.route('/api/search/cities').get([validateToken, api.search.cities]);
	app.route('/api/search/suggestions').get([validateToken, api.search.suggestions]);

	app.route('/api/artcache').get([api.exhibitions.showArtCache]);
	app.route('/api/artcache/:id').put([requireAdmin, api.exhibitions.updateArtCache]);

	app.route('/api/artcache/:id/comments').get([validateToken, api.exhibitions.getComments]);
	app.route('/api/artcache/:id/comments').post([requireToken, api.exhibitions.postComment]);
	app.route('/api/artcache/:id/comments/:id').delete([requireToken, api.exhibitions.deleteComment]);

	/**
	 * Location routes
	 */
	app.route('/api/location/current').get([validateToken, api.location.current]);
	app.route('/api/location/current').put([validateToken, api.location.changeCurrent]);
	app.route('/api/location/city').get(api.location.city);
	app.route('/api/location/cities').get(api.location.cities);
	app.route('/api/location/cities/refresh').get(api.location.refreshCities);
	app.route('/api/location/countries').get(api.location.countries);
	app.route('/api/location/lang').get(api.location.lang);
	app.route('/api/location/translations').get(api.location.translations);

	/** 
	 * Faker routes
	 */
	app.route('/api/faker/truncate/:model').post([requireAdmin, api.faker.truncate]);
	app.route('/api/faker/generate/:model').post([requireAdmin, api.faker.generate]);
	/**
	 * Help commands
	 */
	app.route('/api/help/noaccess').get(api.help.noaccess);
	app.route('/api/help/date').get(api.help.date);
	app.route('/api/help/refresh').get(api.help.refresh);
	app.route('/api/help/galleries').get(api.help.galleries);
	app.route('/api/help/cities').get(api.help.cities);
	app.route('/api/help/locations').get(api.help.locations);
	/**
	 * Settings
	 */
	app.route('/api/settings').get(api.settings.index);
	app.route('/api/settings/:name').get(api.settings.show);
	app.route('/api/settings/:name').put(api.settings.update);

	app.route('/api/testmail').get(api.miscellaneous.testMail);

	/**
	 * Uploading
	 */
	app.route('/api/upload').post([
		validateToken,
		multer({ dest: './temp/' }).single('file'), 
		api.upload.index
	]);

};
