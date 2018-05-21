'use strict';

var mongoose = require('mongoose');

/**
 * Validate token
 */

exports.validate = function(req, tokenId, done) {
  // Create token
  var Token = mongoose.model('Token');
  // Get token first
  Token.findOne({ _id: tokenId }).deepPopulate(['user', 'album', 'album.photos']).exec(function(err, token) {
    // If error
    if (err || !token) {
      // Done
      done(null, false, 'Error validating token');
    } else {
      // Validate
      token.authenticate(req, function(valid, message) {
        // Call next
        done(token, valid, message);
      });
    }
  });
};