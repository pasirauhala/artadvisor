'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto'),
	https = require('follow-redirects').https,
	fs = require('fs'),
	moment = require('moment'),
	appRoot = require('app-root-path'),
	Photo = mongoose.model('Photo');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function(property) {
	return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function(password) {
	return (this.provider !== 'local' || (password && password.length > 6));
};

/**
 * User Schema
 */
var UserSchema = new Schema({
	profileType: {
		type: String,
		enum: ['artlover', 'artist', 'organizer'],
		default: 'artlover'
	},
	name: {
		first: { 
			type: String, 
			default: '', 
			trim: true, 
			//required: 'First name cannot be blank',
			//validate: [validateLocalStrategyProperty, 'Please fill in your first name']
		},
		last: { 
			type: String, 
			default: '', 
			trim: true, 
			//required: 'Last name cannot be blank',
			//validate: [validateLocalStrategyProperty, 'Please fill in your last name']
		}
	},
  recommended: { type: Number, default: 0 },
	photo: { type: Schema.ObjectId, ref: 'Photo' },
	organization: {
		type: String,
		trim: true,
		default: ''
	},
	description: { type: String, trim: true },
	genres: { type: [{ type: String, trim: true }] },
	websites: { type: [{ type: String, trim: true }] },
  album: { type: Schema.ObjectId, ref: 'Album' },
	publications: {
		type: [{
			publisher: { type: String, trim: true, required: 'Publisher name is required' },
			authors: {
				type: [{ type: String, trim: true, required: 'Author name is required' }]
			},
			date: { type: Date, required: 'Published date is required' }
		}]
	},
  links: [{
    title: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' }
  }],
	favorites: {
		exhibitions: [{ type: Schema.ObjectId, ref: 'Exhibition' }],
		artists: [{ type: Schema.ObjectId, ref: 'User' }],
		venues: [{ type: Schema.ObjectId, ref: 'Venue' }]
	},
	recommendations: {
		exhibitions: [{ type: Schema.ObjectId, ref: 'Exhibition' }],
		artists: [{ type: Schema.ObjectId, ref: 'User' }],
		venues: [{ type: Schema.ObjectId, ref: 'Venue' }]
	},
	city: {
		type: Schema.ObjectId,
		ref: 'City'
	},
	email: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your email'],
		match: [/.+\@.+\..+/, 'Please fill a valid email address']
	},
	changeEmail: {
		type: String,
		trim: true,
		match: [/.+\@.+\..+/, 'Please fill a valid email address'],
		select: false
	},
	changeEmailCode: {
		type: String,
		trim: true,
		select: false
	},
	username: {
		type: String,
		unique: 'Username already exists',
		required: 'Please fill in a username',
		trim: true
	},
	password: {
		type: String,
		default: '',
		trim: true,
		select: false,
		validate: [validateLocalStrategyPassword, 'Password should be longer']
	},
	salt: {
		type: String,
		select: false
	},
	social: {
		type: [{
			name: { type: String },
			id: { type: String, trim: true, required: 'Provider id is required' },
			data: { type: Schema.Types.Mixed }
		}]
	},
	roles: {
		type: [{
			type: String,
			enum: ['admin', 'member']
		}],
		default: ['member']
	},
	lang: {
		type: String,
		enum: ['en', 'fi', 'se', 'de'],
		default: 'en'
	},
	notifications: {
		type: String,
		enum: ['on', 'off'],
		default: 'on'
	},

	hiddenArtCache: {
		type: [{
			type: Schema.ObjectId,
			ref: 'Exhibition'
		}]
	},

	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	},
	/* For reset password */
	resetPasswordToken: {
		type: String,
		select: false
	},
	resetPasswordExpires: {
		type: Date
	}
});

UserSchema.set('toObject', {
	virtuals: true
});
UserSchema.set('toJSON', {
	virtuals: true
});

UserSchema.virtual('name.full').get(function() {

	if (this.profileType === 'organizer') {
		return this.organization;
	}

	// Return full name
	return this.name.first + ' ' + this.name.last;
});

UserSchema.virtual('name.abbr').get(function() {

	if (this.profileType === 'organizer') {
		return this.organization;
	}

	// Return full name
	return this.name.first + ' ' + this.name.last.charAt(0) + '.';
});

UserSchema.virtual('fullname').get(function() {

	if (this.profileType === 'organizer') {
		return this.organization;
	}

	// Return full name
	return this.name.first + ' ' + this.name.last;
});

UserSchema.virtual('isArtist').get(function() {
	// Check whether roles include artist
	return this.profileType.indexOf('artist') >= 0;
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
	if (this.password && this.password.length > 6) {
		this.salt = crypto.randomBytes(16).toString('base64');
		this.password = this.hashPassword(this.password);
	}

	next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function(password) {
	if (this.salt && password) {
		return crypto.pbkdf2Sync(password, new Buffer(this.salt, 'base64'), 10000, 64).toString('base64');
	} else {
		return password;
	}
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
};

var getModelType = function(model) {
	// Types
	var collections = {
		exhibitions: 'exhibitions',
		users: 'artists',
		venues: 'venues'
	};
	// Return type
	return collections[model.collection.name];
};

/**
 * Favorite something
 */
UserSchema.methods.favorite = function(model, done) {
	// Type
	var type = getModelType(model);
	// Find
	if (!model.isFavoriteOf(this)) {
		// Add
		this.favorites[type].push(model._id);
		// Save
		this.save(done);
	} else {
		// Call done
		done(null, this);
	}
};

/**
 * Unfavorite something
 */
UserSchema.methods.unfavorite = function(model, done) {
	// Type
	var type = getModelType(model);
	// Find
	if (model.isFavoriteOf(this)) {
		// Get index
		var index = this.favorites[type].indexOf(model._id);
		// Remove
		this.favorites[type].splice(index, 1);
		// Save
		this.save(done);
	} else {
		// Call done
		done(null, this);
	}
};

/**
 * Check if this is favorite of a user
 */
UserSchema.methods.isFavoriteOf = function(user) {
  // If there's exhibitions
  return (user.favorites && 
          user.favorites.artists && 
          (user.favorites.artists.indexOf(this._id) >= 0));
};

/**
 * Recommend something
 */
UserSchema.methods.recommend = function(model, done) {
	// Type
	var type = getModelType(model);
	// Find
	if (!model.isRecommendedBy(this)) {
		// Add
		this.recommendations[type].push(model._id);
		// Save
		this.save(function(err, user) {
			if (!err) {
				// Increment model recommendations
				model.recommended++;
				// Save model
				model.save(function() {
					// Call
					done(err, user);
				});
			} else {
				// Call done
				done(err, user);
			}
		});
	} else {
		// Call done
		done(null, this);
	}
};

/**
 * Unrecommend something
 */
UserSchema.methods.unrecommend = function(model, done) {
	// Type
	var type = getModelType(model);
	// Find
	if (model.isRecommendedBy(this)) {
		// Get index
		var index = this.recommendations[type].indexOf(model._id);
		// Remove
		this.recommendations[type].splice(index, 1);
		// Save
		this.save(function(err, user) {
			if (!err) {
				// Increment model recommendations
				model.recommended--;
				// If below 0
				if (model.recommended < 0) {
					// Minimum is 0
					model.recommended = 0;
				}
				// Save model
				model.save(function() {
					// Call
					done(err, user);
				});
			} else {
				// Call done
				done(err, user);
			}
		});
	} else {
		// Call done
		done(null, this);
	}
};

/**
 * Check if this is recommended of a user
 */
UserSchema.methods.isRecommendedBy = function(user) {
  // If there's exhibitions
  return (user.recommendations && 
          user.recommendations.artists && 
          (user.recommendations.artists.indexOf(this._id) >= 0));
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');

	_this.findOne({
		username: possibleUsername
	}, function(err, user) {
		if (!err) {
			if (!user) {
				callback(possibleUsername);
			} else {
				return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};

/**
 * Create user from facebook or google
 */
UserSchema.statics.passportGetSocial = function(req, profile, done) {
	// This
	var _this = this, User = _this;

	/*
	// Set social
	req.social = profile;
	// Get one user
	this.findOne({}, done);
	*/

	// Set user profile
	var userProfile = {};

	// Get photo
	var downloadSocialPhoto = function(name, url, done) {
		// Filename
		var filename = appRoot + '/temp/' + moment().utc().format('YYYYMMDDHHmmssSSS'),
				file = fs.createWriteStream(filename),
				upload = require('../controllers/api/upload.server.controller');

		var req = https.get(url, function(res) {
			// Write
		  res.on('data', function(d) {
			  file.write(d);
		  });
		  // On complete
		  res.on('end', function() {

		  	upload.upload.process({
		  		path: filename,
		  		originalname: name + '.jpg'
		  	}, function(response) {
		  		// If success
		  		if (response && response.success) {
		  			// Create the photo
				    (new Photo({
				    	source: response.file.full
				    })).save(function(err, photo) {
				    	// Done
				    	done(photo || null);
				    });
		  		} else {
		  			// Done anyway
		  			done(null);
		  		}
		  	});

		  });
		});
	};

	// Select
	switch (profile.provider) {
		case 'facebook':
			userProfile = {
				name: {
					first: profile._json.first_name,
					last: profile._json.last_name
				},
				email: profile._json.email,
				social: {
					name: 'facebook',
					id: profile._json.id,
					data: profile._json
				}
			};
			break;
		case 'google':
			userProfile = {
				name: {
					first: profile._json.given_name || 'John',
					last: profile._json.family_name || 'Doe'
				},
				email: profile._json.email,
				social: {
					name: 'google',
					id: profile._json.id,
					data: profile._json
				}
			};
			break;
	}

	// Look for email first
	_this.findOne({
		email: userProfile.email
	}).exec(function(err, user) {
		// If there's error
		if (err) {
			// Exit immediately
			done(err);
			return false;
		}

		// Make sure there's photo
		var makeSureTheresPhoto = function(user, done) {
			// If there's no photo
			if (userProfile.social.name === 'facebook' && !user.photo) {
				// Download
				downloadSocialPhoto(
					userProfile.name.first + ' ' + userProfile.name.last, 
					'https://graph.facebook.com/' + userProfile.social.id + '/picture?width=400&height=400', function(photo) {
					// Download complete
					// Set photo
					user.photo = photo._id;
					// Done
					done(user, true);
				});
			} else {
				// Done
				done(user, false);
			}
		};

		// If there's a user
		if (user) {
			// Has social
			var hasSocial = false;
			// Check if user has a social
			for (var i in user.social) {
				// Get social
				var social = user.social[i];
				// If match 
				if (social.name === userProfile.social.name && 
						social.id === userProfile.social.id) {
					// Break
					hasSocial = true;
					break;
				}
			}
			// If there's social
			if (hasSocial) {
				// Make sure there's photo
				makeSureTheresPhoto(user, function(user, newPhoto) {
					// If there's new photo
					if (newPhoto) {
						// Save
						user.save(done);
					} else {
						// Just call done
						done(null, user);
					}
				});
				return false;
			}
			// Append to his social
			user.social.push(userProfile.social);

			// Make sure there's photo
			makeSureTheresPhoto(user, function(user, newPhoto) {
				// Just save
				user.save(done);
			});
			// Exit
			return false;
		}

		// Generate password
		var password = '@*^!&^%$~';

		// Create user here
		// Create username first
		_this.generateUsername(userProfile.name, function(username) {
      // Proceed registration
      user = new User({
        name: userProfile.name,
        username: username,
        email: userProfile.email,
        password: password,
        social: [userProfile.social]
      });
      // Make sure
      makeSureTheresPhoto(user, function(user) {
	      // Save
	      user.save(done);
      });
		});
	});
};

/**
 * Generate username from name
 */
UserSchema.statics.generateUsername = function(name, done, count) {
	// This
	var _this = this;

	var username = '';

	if (name.profileType && name.organization && name.profileType === 'organizer') {
		username = name.organization.toLowerCase().replace(/\s/g, '.');
	} else {
		username = 
			name.first.toLowerCase().replace(/\s/g, '.') + '.' + 
			name.last.toLowerCase().replace(/\s/g, '.') + (count ? ('.' + count) : '');
	}

  // Check if username is taken
  _this.findOne({ username: username }).exec(function(err, user) {
    // If there's any
    if (!err && user) {
      // Repeat
      _this.generateUsername(name, done, count ? (count + 1) : 1);
    } else {
      // Call done
      done(username);
    }
  });
};

mongoose.model('User', UserSchema);
