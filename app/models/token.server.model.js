'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  moment = require('moment');

/**
 * Token Schema
 */
var TokenSchema = new Schema({
  ipAddress: { type: String, required: 'IP address is required' },
  expires: { type: Number, default: 1800 }, // Default expires in 30 minutes
  status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' },
  created: { type: Date, default: Date.now },
  updated: { type: Date, default: Date.now },
  user: { type: Schema.ObjectId, ref: 'User' }
});

TokenSchema.set('toObject', {
  virtuals: true
});
TokenSchema.set('toJSON', {
  virtuals: true
});

/**
 * @param req Request object
 * @return bool True if token is still valid
 */
TokenSchema.methods.authenticate = function(req, done) {
  // If token is invalid
  if (this.status !== 'active') {
    // Call
    done(false, 'Token is ' + this.status);
    // Return
    return false;
  }
  // Get remote ip
  var remoteIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // If ip doesn't match
  if (remoteIp !== this.ipAddress) {
    // Call done with invalid
    done(false, 'IP address does not match');
    // Quit
    return false;
  }
  // On updated
  var now = moment();
  var updated = moment(this.updated);
  // Get date difference
  var diff = moment.duration(now.diff(updated)).asSeconds();
  // If difference is greater than expires
  if (diff > this.expires) {
    // Expired
    this.status = 'expired';
    this.save(function(err, token) {
      // Call done
      done(false, 'Token is expired');
    });
    return false;
  }
  // Update token
  this.updated = now;
  this.save(function(err, token) {
    // Call done
    done(true, 'Token is active');
  });
};

mongoose.model('Token', TokenSchema);
