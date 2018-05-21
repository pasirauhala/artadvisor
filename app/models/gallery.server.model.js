'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Gallery Schema
 */
var GallerySchema = new Schema({
  title: { type: String, default: '' },
  photos: { 
    type: [{
      photo: { type: Schema.ObjectId, ref: 'Photo' },
      caption: { type: String, default: '' },
      artists: { 
        type: [{
          type: Schema.ObjectId,
          ref: 'User'
        }]
      },
      nonUserArtists: {
        type: [{
          fullname: {
            type: String,
            trim: true
          }
        }]
      },
      order: { type: Number, default: 0 },
      added: { type: Date, default: Date.now }
    }]
  },
  created: { type: Date, default: Date.now },
  exhibition: { type: Schema.ObjectId, ref: 'Exhibition' }
});

// Get artists ids
GallerySchema.statics.getArtistsIds = function(artists) {
  // Set ids
  var artistsIds = [];
  // If there's artist
  if (artists) {
    // Loop
    for (var i in artists) {
      // Make sure there's id
      if (artists[i]._id) {
        // Add to artists
        artistsIds.push(artists[i]._id);
      }
    }
  }
  return artistsIds;
};

GallerySchema.methods.insertPhotos = function(photos, done, index) {
  // Get gallery
  var gallery = this;
  // Get photo
  var Photo = mongoose.model('Photo');
  // If no index
  if (!index) {
    index = 0;
  }
  // If max
  if (index >= photos.length) {
    // Save all photos
    for (var i in photos) {
      // Push photos
      this.photos.push({
        photo: photos[i]
      });
    }
    // Save
    this.save(function(err, gallery) {
      // Call done
      done(gallery, photos);
    });
    return false;
  }
  // Get photo
  var photoData = photos[index];

  // Create photo
  var photo = new Photo({
    title: photoData.title,
    source: photoData.source,
    order: index,
    gallery: gallery.id || (gallery._id || '').toString(),
    exhibition: (gallery.exhibition && gallery.exhibition.name) ? gallery.exhibition.id : gallery.exhibition.toString()
  });
  // Save
  photo.save(function(err, photo) {
    // Get artist ids
    var artistsIds = GallerySchema.statics.getArtistsIds(photoData.artists);
    // Edit photos
    photos[index] = {
      photo: photo._id,
      caption: photoData.caption,
      artists: artistsIds,
      order: (this.photos ? this.photos.length : 0) + index
    };
    // Call insert again
    gallery.insertPhotos(photos, done, index + 1);
  });
};

/**
 * Populate photos
 */
GallerySchema.methods.populatePhotos = function(done, index) {
  // Get gallery
  var gallery = this;
  // Get photo
  var Photo = mongoose.model('Photo');
  // If index is not defined
  if (!index) {
    // Set as 0
    index = 0;
  }
  // Set it
  if (!this._photos) {
    this._photos = [];
  }
  // If index equals max
  if (index >= this.photos.length) {
    // Done
    done();
  } else {
    // Load photo
    Photo
      .findOne({ _id: this.photos[index].photo })
      .exec(function(err, photo) {
        // Set photo
        gallery._photos[index] = photo;
        // Call next
        gallery.populatePhotos(done, index + 1);
      });
  }
};

/**
 * Find in gallery
 */
GallerySchema.methods.findPhotosBySource = function(sources, found) {
  // Set gallery
  var gallery = this;
  // If there are no photos
  if (typeof this._photos === 'undefined') {
    // Populate first
    this.populatePhotos(function() {
      // Recurse
      gallery.findPhotosBySource(sources, found);
    });
  } else {
    // Set photos
    var tempPhotos = [], excess = [];
    // Set sources
    if (!(sources instanceof Array)) {
      // Put in array
      sources = [sources];
    }
    // Loop through photos
    for (var i in gallery._photos) {
      // Get index
      var index = sources.indexOf(gallery._photos[i].source);
      // If found
      if (index >= 0) {
        // Set order
        gallery._photos[i].order = index;
        // Append to photos
        tempPhotos.push(gallery._photos[i]);
      } else {
        // Add to excess
        excess.push(gallery._photos[i]);
      }
    }
    // Sort photos by order
    if (tempPhotos) {
      tempPhotos.sort(function(a, b) {
        return a.order - b.order;
      });
    }

    var photos = [], pCounter = 0;
    // Loop through sources
    for (var j in sources) {
      // If there's photo
      if (pCounter < tempPhotos.length && (tempPhotos[pCounter].source === sources[j])) {
        // Make sure of the order
        tempPhotos[pCounter].order = j;
        // Add to photos
        photos.push(tempPhotos[pCounter]);
        // Increment
        pCounter++;
      } else {
        // Add with source
        photos.push({
          title: '',
          order: j,
          source: sources[j],
          gallery: gallery.id || (gallery._id || '').toString(),
          exhibition: (gallery.exhibition && gallery.exhibition.name) ? gallery.exhibition.id : gallery.exhibition.toString()
        });
      }
    }

    // Found
    found(photos, excess);
  }
};

/**
 * Update photos
 */
GallerySchema.methods.updatePhotos = function(photos, done) {
  // Get gallery
  var gallery = this;
  // Get photo
  var Photo = mongoose.model('Photo');

  // Arrange photos first
  if (photos) {
    // Get sources
    var sources = [], photoSources = [];

    // Loop
    for (var i in photos) {
      var source = '';

      if (typeof photos[i] === 'object') {
        source = photos[i].source || '';
      } else {
        source = photos[i];
      }

      // If there's source
      if (source) {
        // Push
        sources.push(source);
        photoSources.push(photos[i]);
      }
    }

    // Find photos
    gallery.findPhotosBySource(sources, function(photos, excess) {
      // Update titles
      for (var k in photos) {
        // Set title
        photos[k].title = photoSources[k].title;
        photos[k].order = k;
        // If there's no gallery
        if (!photos[k].gallery) {
          // Set it
          photos[k].gallery = gallery._id;
        }
        // If there's no exhibition
        if (!photos[k].exhibition && gallery.exhibition) {
          // Set it
          photos[k].exhibition = gallery.exhibition._id || gallery.exhibition;
        }
      }
      // Save multiple
      Photo.saveMultiple(photos, function(photos) {
        // Reset photos
        gallery.photos = [];
        // Loop through new photos
        for (var j in photos) {
          // Get artists
          var artistsIds = GallerySchema.statics.getArtistsIds(photoSources[j].artists);
          // Non artists
          var nonUserArtists = [];

          /* jshint ignore:start */
          (photoSources[j].nonUserArtists || []).forEach(function(artist) {
            // If there's any
            if (artist && artist.fullname) {
              nonUserArtists.push({
                fullname: artist.fullname
              });
            }
          });
          /* jshint ignore:end */

          // Add photo
          gallery.photos.push({
            photo: photos[j]._id,
            caption: photoSources[j].caption || '',
            artists: artistsIds,
            nonUserArtists: nonUserArtists,
            order: j
          });
        }

        // Save
        gallery.save(function(err, gallery) {
          // Delete excess
          Photo.removeMultiple(excess, function() {
            // Complete update
            done(gallery);
          });
        });
      });
    });
  } else {
    done(gallery);
  }
};

mongoose.model('Gallery', GallerySchema);
