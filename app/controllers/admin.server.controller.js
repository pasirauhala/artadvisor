'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('./errors.server.controller'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User');

exports.index = function(req, res) {
	// Render
	res.render('layouts/admin', {
    root: '',
    token: req.token || null
  });
};