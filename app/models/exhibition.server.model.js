'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
  moment = require('moment'),
	generator = require('../controllers/api/helpers/generator.server.helper');

/**
 * Exhibition Schema
 */
var ExhibitionSchema = new Schema({
	name: { type: String, trim: true, required: 'Exhibition name is required'  },
	permalink: { type: String, trim: true }, //required: 'Permalink is required' },
	permalinkSafe: { type: String, trim: true }, //required: 'Safe permalink is required' },
	secondaryName: { type: String, trim: true },
	description: { type: String, trim: true },
  recommended: { type: Number, default: 0 },
  admissionFee: { type: String, default: 'free' },
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
  writtenInMedia: { type: String, trim: true },
  links: [{
    title: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, required: 'Link is required' }
  }],
	startDate: { type: Date, default: Date.now },
	endDate: { type: Date, default: Date.now },
	tags: {
		type: [{ type: String, trim: true }]
	},
	artists: [{
    user: { type: Schema.ObjectId, ref: 'User' },
    nonUser: {
      fullname: { type: String, trim: true }
    }
  }],
	gallery: { type: Schema.ObjectId, ref: 'Gallery' },
  genres: { type: [{ type: String, trim: true }] },
  additional: { type: Boolean, default: false },
  title: { type: String, trim: true, default: '' },
	created: { type: Date, default: Date.now },
	venue: { type: Schema.ObjectId, ref: 'Venue' },
  coordinates: {
    type: [Number],
    index: '2d'
  },
	owner: { type: Schema.ObjectId, ref: 'User' }
});

ExhibitionSchema.set('toObject', {
	virtuals: true
});
ExhibitionSchema.set('toJSON', {
	virtuals: true
});

ExhibitionSchema.virtual('owners').get(function() {
  // No owner
  if (!this.owner) {
    return [];
  }
  
  var owners = [];
  // Loop through artists
  for (var i in this.artists) {
    // Check for user
    if (this.artists[i].user) {
      // Push
      owners.push(this.artists[i].user._id || this.artists[i].user);
    }
  }
  // Get owner id
  var ownerId = this.owner._id || this.owner;
  // If not in owners
  if (owners.indexOf(ownerId) < 0) {
    // Add to ownwers
    owners.push(ownerId);
  }
  // Return owners
  return owners;
});

/**
 * Hook a pre save method to hash the password
 */
ExhibitionSchema.pre('save', function(next) {
  // Make sure to update coordinates
  this.updateCoordinates(function(coordinates) {
    next();
  });
});

// Check if owner
ExhibitionSchema.methods.isOwner = function(user) {
  // If no id
  if (!user || !user._id) {
    return false;
  }
  // Loop through owners
  for (var i in this.owners) {
    // Compare
    if (user._id.toString() === this.owners[i].toString()) {
      return true;
    }
  }
  return false;
};

var isOpenToday = function() {
  // Now, start, and end
  var now = moment(), start = moment(this.startDate), end = moment(this.endDate);
  // Open today
  return (now.diff(this.startDate) >= 0 && end.diff(now) >= 0);
};

ExhibitionSchema.virtual('active').get(function() {
  // Return
  return isOpenToday.apply(this);
});

ExhibitionSchema.virtual('status').get(function() {

  if (!isOpenToday.apply(this)) {
    return 'closed';
  }
  
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

/**
 * Check if this is favorite of a user
 */
ExhibitionSchema.methods.isFavoriteOf = function(user) {
  // If there's exhibitions
  return (user.favorites && 
          user.favorites.exhibitions && 
          (user.favorites.exhibitions.indexOf(this._id) >= 0));
};

/**
 * Check if this is recommended by a user
 */
ExhibitionSchema.methods.isRecommendedBy = function(user) {
  // If there's exhibitions
  return (user.recommendations && 
          user.recommendations.exhibitions && 
          (user.recommendations.exhibitions.indexOf(this._id) >= 0));
};

/**
 * Update coordinates
 */
ExhibitionSchema.methods.updateCoordinates = function(done) {
  // The event
  var self = this;
  // Get venue
  (function(done) {
    // If there's venue
    if (self.venue && self.venue._id) {
      // Dump venue
      done(self.venue);
    } else {
      // Fetch venue
      var Venue = mongoose.model('Venue');
      // Find by id
      Venue.findOne({ _id: self.venue }).exec(function(err, venue) {
        // Dump
        done(venue || null);
      });
    }
  })(function(venue) {
    // The coordinates
    var coordinates = [];
    // If there's venue
    if (venue && venue.address && venue.address.coordinates) {
      // Get coordinates
      coordinates.push(venue.address.coordinates.longitude || 0);
      coordinates.push(venue.address.coordinates.latitude || 0);
    }
    // Update
    self.coordinates = coordinates;
    // Call done
    done(coordinates);
  });
};

ExhibitionSchema.statics.generatePermalink = function(name, done, ignoreId) {
  // Generate a safe permalink
  var permalinkSafe = generator.permalink(name);
  // Get model
  var Exhibition = mongoose.model('Exhibition');
  // Set find
  var find = Exhibition.find({ permalinkSafe: permalinkSafe });
  // If there's ignore
  if (ignoreId) {
    // Ignore id
    find.where('_id').ne(ignoreId);
  }
  // Find a venue with this permalink
  find.exec(function(err, exhibitions) {
    // Count exhibitions
    var countExhibitions = exhibitions.length;
    // Reserved
    var isReserved = (['create'].indexOf(permalinkSafe) >= 0);
    // Get new permalink
    var permalink = permalinkSafe + ((countExhibitions || isReserved) ? ('-' + (countExhibitions + 2)) : '');
    // Call done
    if (done) done(permalink, permalinkSafe);
  });
};

ExhibitionSchema.statics.validateOpeningHours = function(openingHours) {
  if (openingHours) {
    for (var i in openingHours) {
      // Check if there are hours
      if (openingHours[i].hours) {
        // Loop through hours
        for (var j in openingHours[i].hours) {
          // Get range
          var range = openingHours[i].hours[j];
          // Check for range
          if (range) {
            // If there's start and end
            if (range.start !== '' && range.end !== '') {
              // Check
              if (parseInt(range.start) > parseInt(range.end)) {
                // Error
                return false;
              }
            }
          }
        }
      }
    }
  }
  return true;
};

ExhibitionSchema.statics.validateSpecialHours = function(specialHours) {

  if (specialHours && specialHours.length > 0) {
    for (var i in specialHours) {

      // If there's special hours
      if (specialHours[i].date !== '') {
        // Validate date
        var date = moment(specialHours[i].date);

        // If not valid
        if (!date.isValid()) {
          // Return false
          return false;
        } else {
          // Make sure range is correct
          if (specialHours[i].startHour !== '' && specialHours[i].endHour !== '') {
            // Check
            if (parseInt(specialHours[i].startHour) > parseInt(specialHours[i].endHour)) {
              // Error
              return false;
            }
          }
        }
      }
    }
  }
  return true;
};

mongoose.model('Exhibition', ExhibitionSchema);
