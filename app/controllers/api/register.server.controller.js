'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  api = require('./helpers/api.server.helper'),
  User = mongoose.model('User');

exports.register = {

  /**
   * Error
   */
  error: function(res, message) {
    // Error message
    api.json(res, { success: false, message: message });
    // Return false
    return false;
  },

  /**
   * Do register
   */
  index: function(req, res) {
    // Trim everything
    req.body.email = req.body.email.trim();
    req.body.password = req.body.password.trim();
    req.body.name.first = (req.body.name.first || '').trim();
    req.body.name.last = (req.body.name.last || '').trim();
    // Make sure all fields are provided
    if (!req.body.email) {
      // Error
      return exports.register.error(res, 'Email address is required');
    }
    // Validate email address
    if (!req.body.email.match(/.+\@.+\..+/)) {
      // Invalid email
      return exports.register.error(res, 'Invalid email address');
    }
    if (!req.body.password) {
      // Error
      return exports.register.error(res, 'Password is required');
    }
    if (req.body.type !== 'organizer' && !req.body.name.first) {
      // Error
      return exports.register.error(res, 'First name is required');
    }
    if (req.body.type !== 'organizer' && !req.body.name.last) {
      // Error
      return exports.register.error(res, 'Last name is required');
    }

    if (req.body.type === 'organizer' && !req.body.organization) {
      // Error
      return exports.register.error(res, 'Organization is required');
    }

    // Check if email is registered
    User.findOne({ email: req.body.email }).exec(function(err, user) {
      // If there's any
      if (!err && user) {
        // This means email is already in use
        exports.register.error(res, 'Email already in use');
      } else {
        // Set name
        var name = {
          first: req.body.name.first,
          last: req.body.name.last,
          organization: req.body.organization,
          profileType: req.body.type
        };
        // Generate username first
        User.generateUsername(name, function(username) {
          // Proceed registration
          user = new User({
            profileType: req.body.type,
            name: name,
            organization: req.body.organization,
            genres: req.body.genres ? req.body.genres : [],
            username: username,
            email: req.body.email,
            password: req.body.password
          });
          // Save
          user.save(function(err, user) {
            // If there's an error
            if (err) {
              // Call error
              exports.register.error(res, 'Error creating user');
            } else {
              // Created
              api.json(res, { success: true, data: user });
            }
          });
        });
      }
    });

  }
};