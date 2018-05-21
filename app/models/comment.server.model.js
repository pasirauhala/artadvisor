'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Comment Schema
 */
var CommentSchema = new Schema({
  content: { type: String, default: '' },
  status: { type: Number, default: 1 },
  created: { type: Date, default: Date.now },

  artist: { type: Schema.ObjectId, ref: 'User' },
  exhibition: { type: Schema.ObjectId, ref: 'Exhibition' },
  venue: { type: Schema.ObjectId, ref: 'Venue' },

  owner: { type: Schema.ObjectId, ref: 'User' },
  parent: { type: Schema.ObjectId, ref: 'Comment' }
});

CommentSchema.set('toObject', {
  virtuals: true
});
CommentSchema.set('toJSON', {
  virtuals: true
});

mongoose.model('Comment', CommentSchema);