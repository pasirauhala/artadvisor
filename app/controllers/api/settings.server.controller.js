'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  generator = require('./helpers/generator.server.helper'),
  api = require('./helpers/api.server.helper'),
  Setting = mongoose.model('Setting');

exports.settings = {

  /**
   * Call this when you have no access to admin
   */
  index: function(req, res) {
    // Get all settings
    api.find(res, Setting, {}, null, req.query, []);
  },

  /**
   * Get single
   */
  show: function(req, res) {
    // Get setting
    Setting.fetch(req.params.name, function(setting) {
      // Show
      api.json(res, setting);
    });
  },

  /**
   * Update single
   */
  update: function(req, res) {


  }

};