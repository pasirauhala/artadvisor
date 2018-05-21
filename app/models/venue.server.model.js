'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
  moment = require('moment'),
	generator = require('../controllers/api/helpers/generator.server.helper');

/**
 * Venue Schema
 */
var VenueSchema = new Schema({
  venueType: { type: String, required: 'Venue type is required', default: 'gallery', trim: true },
  venueTypes: [{
    type: String, trim: true
  }],
	name: { type: String, required: 'Venue name is required' },
	permalink: { type: String, required: 'Permalink is required' },
	permalinkSafe: { type: String, required: 'Safe permalink is required' },
	description: { type: String, trim: true, default: '' },
  recommended: { type: Number, default: 0 },
  admissionFee: { type: String, default: 'free' },
	address: {
    line1: { type: String, trim: true },
    city: { type: String, trim: true },
    ascii: { type: String },
    country: { 
      type: Schema.ObjectId, ref: 'Country' 
    },
    lang: {
      type: String,
      enum: ['en', 'fi', 'sv', 'de'],
      default: 'en'
    },
		coordinates: { 
			latitude: { type: Number, required: 'Latitude for coordinations is required' },
			longitude: { type: Number, required: 'Longitude for coordinations is required' }
		}
	},
  website: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  openingHours: [{ 
    day: { type: Number },
    hours: [{
      start: { type: String },
      end: { type: String }
    }]
  }],
  specialHours: [{
    date: { type: String },
    startHour: { type: String },
    endHour: { type: String }
  }],
  openByAppointment: { type: Boolean, default: false },
  exceptionalOpeningHours: { type: String, trim: true },
  writtenInMedia: { type: String, trim: true },
  links: [{
    title: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, required: 'Link is required' }
  }],
	tags: {
		type: [{ type: String, trim: true }]
	},
	created: { type: Date, default: Date.now },
  album: { type: Schema.ObjectId, ref: 'Album' },
	owner: { type: Schema.ObjectId, ref: 'User' }
});

VenueSchema.set('toObject', {
	virtuals: true
});
VenueSchema.set('toJSON', {
	virtuals: true
});

VenueSchema.virtual('address.full').get(function() {
  // Return full name
  return this.address.line1 + (this.address.line1 ? ', ' : '') + this.address.city;
});

VenueSchema.virtual('contacts').get(function() {
  // Return phone and email
  var contacts = [];
  if (this.phone) {
    contacts.push(this.phone);
  }
  if (this.email) {
    contacts.push(this.email);
  }
  return contacts;
});

VenueSchema.virtual('status').get(function() {
  // Vars
  var now = moment(), day = now.isoWeekday() - 1, hour = parseInt(now.format('Hmm'));

  // Check for special first
  if (this.specialHours) {
    // Loop through
    for (var h in this.specialHours) {
      // Make sure there's date, start, and end
      if (this.specialHours[h].date && this.specialHours[h].startHour && this.specialHours[h].endHour) {
        // Check if date matches
        var date = moment(this.specialHours[h].date, 'DD.MM.YYYY'),
            startHour = parseInt(this.specialHours[h].startHour),
            endHour = parseInt(this.specialHours[h].endHour);

        if (now.format('YYYYMMDD') === date.format('YYYYMMDD')) {
          // Check if hour fits
          if (startHour <= hour && endHour >= hour) {
            // Return special
            return 'special';
          }
        }
      }
    }
  }

  if (this.openingHours) {
    for (var i in this.openingHours) {
      if (this.openingHours[i].day === day && this.openingHours[i].hours) {
        // Loop through
        for (var j in this.openingHours[i].hours) {
          // Range
          var range = this.openingHours[i].hours[j];
          if (parseInt(range.start) <= hour && parseInt(range.end) >= hour) {
            return 'open';
          }
        }
      }
    }
  }
  return 'closed';
});

VenueSchema.post('save', function(venue) {
  // Exhibition
  var Exhibition = mongoose.model('Exhibition');
  // Find exhibitions that has this venue
  Exhibition.find({ venue: venue._id }).exec(function(err, exhibitions) {
    // Loop
    (exhibitions || []).forEach(function(exhibition) {
      // Save
      exhibition.save();
    });
  });
});

/**
 * Check if this is favorite of a user
 */
VenueSchema.methods.isFavoriteOf = function(user) {
  // If there's exhibitions
  return (user.favorites && 
          user.favorites.venues && 
          (user.favorites.venues.indexOf(this._id) >= 0));
};

/**
 * Check if this is recommended by a user
 */
VenueSchema.methods.isRecommendedBy = function(user) {
  // If there's exhibitions
  return (user.recommendations && 
          user.recommendations.venues && 
          (user.recommendations.venues.indexOf(this._id) >= 0));
};

VenueSchema.statics.generatePermalink = function(name, done, ignoreId) {
  // Generate a safe permalink
  var permalinkSafe = generator.permalink(name);
  // Get model
  var Venue = mongoose.model('Venue');
  // Set find
  var find = Venue.find({ permalinkSafe: permalinkSafe });
  // If there's ignore
  if (ignoreId) {
    // Ignore id
    find.where('_id').ne(ignoreId);
  }
  // Find a venue with this permalink
  find.exec(function(err, venues) {
    // Count venues
    var countVenues = venues.length;
    // Reserved
    var isReserved = (['create'].indexOf(permalinkSafe) >= 0);
    // Get new permalink
    var permalink = permalinkSafe + ((countVenues || isReserved) ? ('-' + (countVenues + 2)) : '');
    // Call done
    if (done) done(permalink, permalinkSafe);
  });
};

mongoose.model('Venue', VenueSchema); 
