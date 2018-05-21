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
  notification = require('./helpers/notification.server.helper'),
  User = mongoose.model('User'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),

  async = require('async'),
  moment = require('moment'),

  nodemailer = require('nodemailer'),
  transporter = nodemailer.createTransport();

exports.miscellaneous = {

  feedback: function(req, res) {

    // Set input
    var input = {
      name: (req.token && req.token.user) ? req.token.user.name.full : (req.body.name || ''),
      email: (req.token && req.token.user) ? req.token.user.email : (req.body.email || ''),
      subject: req.body.subject || '',
      content: req.body.content || ''
    };

    for (var i in input) {
      // If not set
      if (!input[i]) {
        // Error
        api.success(res, i.substr(0, 1).toUpperCase() + i.substr(1) + ' is required');
        return false;
      }
    }

    var content = notification.template('feedback', input);

    // Notification
    notification.email({
      name: 'Art Advisor',
      email: 'support@artadvisor.fi'
    }, 'A user has sent a feedback: ' + input.subject, content, function(err, response) {
      // If there's error
      if (err) {
        api.success(res, 'Error. Please try again later', true);
      } else {
        api.success(res, 'Feedback sent. We will contact you as soon as possible');
      }
    });

  },

  report: function(req, res) {

    // Set input
    var input = {
      name: (req.token && req.token.user) ? req.token.user.name.full : (req.body.name || ''),
      email: (req.token && req.token.user) ? req.token.user.email : (req.body.email || ''),
      url: req.body.url || '',
      subject: req.body.subject || '',
      content: req.body.content || ''
    };

    for (var i in input) {
      // If not set
      if (!input[i]) {
        // Error
        api.success(res, i.substr(0, 1).toUpperCase() + i.substr(1) + ' is required');
        return false;
      }
    }

    var content = notification.template('report', input);

    // Notification
    notification.email({
      name: 'Art Advisor',
      email: 'support@artadvisor.fi'
    }, 'A user has sent a report: ' + input.subject, content, function(err, response) {
      // If there's error
      if (err) {
        api.success(res, 'Error. Please try again later', true);
      } else {
        api.success(res, 'Report sent. We will process this as soon as possible');
      }
    });

  },

  invite: function(req, res) {

    var hostUrl = req.protocol + '://' + req.headers.host;

    // Get emails
    var rawEmails = (req.body.emails || '').split('\n'), emails = [];
    // Loop
    for (var i in rawEmails) {
      var email = rawEmails[i].trim();
      // Add
      if (email && email.match(/.+\@.+\..+/)) {
        emails.push(email);
      }
    }
    // If there's nothing
    if (!emails.length) {
      // Return
      api.success(res, 'Type at least one email address', true);
      return false;
    }

    // Get user
    var user = (req.token && req.token.user) ? req.token.user : null;

    // Get template
    var content = notification.template(user ? 'invite-auth' : 'invite', {
      name: (user ? user.name.full : ''),
      link: hostUrl + '/landing'
    });

    // Notification
    notification.email(emails, 'Invitation to Art Advisor', content, function(err, response) {
      // If there's error
      if (err) {
        api.success(res, 'Error. Please try again later', true);
      } else {
        api.success(res, 'Your invitation has been sent. Thank you');
      }
    });

  },

  /**
   * Test email
   */
  testMail: function(req, res) {

    transporter.sendMail({
      from: 'support@artadvisor.fi',
      to: ['ronald@codersforhire.net', 'ronaldborla@gmail.com'],
      subject: 'Test email',
      text: 'Hello, this is just a test email'
    }, function(error, info) {

      console.log(error);
      console.log(info);

      api.data(res, {
        error: error,
        info: info
      });

    });

  },

  /**
   * Summary
   */
  summary: function(req, res) {
    // Just count
    async.parallel([
      // Count users
      function(done) {
        User.find({ }).count().exec(function(err, count) {
          // Call next
          done(err, count || 0);
        });
      },
      // Count artists
      function(done) {
        User.find({ profileType: 'artist' }).count().exec(function(err, count) {
          // Call done
          done(err, count || 0);
        });
      },
      // Count grant total events
      function(done) {
        Exhibition.find({ additional: false }).count().exec(function(err, count) {
          // Call done
          done(err, count || 0);
        });
      },
      // Count active events
      function(done) {
        // Set filters
        var today = moment().utc().startOf('day'), filters = {
          additional: false,
          startDate: {
            $lte: today
          },
          endDate: {
            $gte: today
          }
        };
        Exhibition.find(filters).count().exec(function(err, count) {
          // Call done
          done(err, count || 0);
        });
      },
      // Count venues
      function(done) {
        Venue.find({ }).count().exec(function(err, count) {
          // Call done
          done(err, count || 0);
        });
      }
    ], function(errors, results) {
      // Json
      api.json(res, {
        users: results[0],
        artists: results[1],
        events: {
          total: results[2],
          active: results[3]
        },
        venues: results[4]
      });
    });
  }

};