'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors.server.controller'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	generator = require('./helpers/generator.server.helper');

exports.faker = {

	/**
	 * Truncate model
	 */
	truncate: function(req, res) {
		// Get collection name
		var collectionName = generator.getModel(req.params.model).collection.name;
		// Empty collection
		mongoose.connection.db.dropCollection(collectionName, function() {
			// If model is user
			if (['user', 'artist', 'admin'].indexOf(req.params.model.toLowerCase()) >= 0) {
				// Generate admin
				generator.model('admin', 1, function(success, message) {
					res.json({
						success: true,
						message: 'Emptied ' + collectionName + ' and generated 1 administrator'
					});
				});
				// Exit right away
				return false;
			}
			// Emptied
			res.json({
				success: true,
				message: 'Emptied ' + ((collectionName === 'exhibitions') ? 'events' : collectionName) + ' collection'
			});
		});
	},

	/**
	 * Generate fake data
	 */
	generate: function(req, res) {
		// Generate model
		generator.model(req.params.model, req.body.amount, function(success, message) {
			// When model generation completes
			res.json({
				success: success, 
				message: success ? ('Generated ' + req.body.amount + ' ' + ((req.params.model === 'exhibition') ? 'event' : req.params.model) + 's') : message
			});
		});
	}

};