'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Album Schema
 */
var AlbumSchema = new Schema({
	title: { type: String, default: '' },
	photos: { type: [{ type: Schema.ObjectId, ref: 'Photo' }] },
  created: { type: Date, default: Date.now },
});

AlbumSchema.methods.insertPhotos = function(photos, done, index) {
  // Get album
  var album = this;
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
      // If there's photos
      if (photos[i] && photos[i]._id) {
        // Push photos
        this.photos.push(photos[i]._id);
      }
    }
    // Save
    this.save(function(err, album) {
      // Call done
      done(album, photos);
    });
    return false;
  }
  // Get photo
  var photoData = photos[index];
  // If not object
  if (typeof photoData !== 'object') {
    // Set as object
    photoData = {
      title: '',
      order: index,
      source: photoData,
      owner: this._id
    };
  }

  // Create photo
  var photo = new Photo(photoData);
  // Save
  photo.save(function(err, photo) {
    // Edit photos
    photos[index] = photo;
    // Call insert again
    album.insertPhotos(photos, done, index + 1);
  }); 
};

/**
 * Populate photos
 */
AlbumSchema.methods.populatePhotos = function(done, index) {
  // Set album
  var album = this;
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
    Photo.findOne({ _id: this.photos[index] })
      .exec(function(err, photo) {
        // Set photo
        album._photos[index] = photo;
        // Call next
        album.populatePhotos(done, index + 1);
      });
  }
};

/**
 * Find in album
 */
AlbumSchema.methods.findPhotosBySource = function(sources, found) {
  // Set album
  var album = this;
  // If there are no photos
  if (typeof this._photos === 'undefined') {
    // Populate first
    this.populatePhotos(function() {
      // Recurse
      album.findPhotosBySource(sources, found);
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
    for (var i in album._photos) {
      // Get index
      var index = sources.indexOf(album._photos[i].source);
      // If found
      if (index >= 0) {
        // Set order
        album._photos[i].order = index;
        // Append to photos
        tempPhotos.push(album._photos[i]);
      } else {
        // Add to excess
        excess.push(album._photos[i]);
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
          owner: album._id
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
AlbumSchema.methods.updatePhotos = function(photos, done) {
  // Get album
  var album = this;
  // Get photo
  var Photo = mongoose.model('Photo');

  // Arrange photos first
  if (photos) {
    // Get sources
    var sources = [];
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
      }
    }
    // Find photos
    album.findPhotosBySource(sources, function(photos, excess) {
      // Save multiple
      Photo.saveMultiple(photos, function(photos) {
        // Extract ids
        var photoIds = [];
        for (var j in photos) {
          photoIds.push(photos[j]._id);
        }
        // Update
        album.photos = photoIds;
        // Save
        album.save(function(err, album) {
          // Delete excess
          Photo.removeMultiple(excess, function() {
            // Complete update
            done(album);
          });
        });
      });
    });
  } else {
    done(album);
  }
};

/**
 * Delete photo from album
 */
AlbumSchema.methods.deletePhotos = function(photoIds, done) {
  // If not in array
  if (photoIds.constructor !== Array) {
    // Put in array
    photoIds = [photoIds];
  }

  var Album = mongoose.model('Album'),
      Photo = mongoose.model('Photo');

  // Get all ids in album
  Album.findOne({ _id: this._id }).deepPopulate('photos').exec(function(err, album) {

    // Deleted
    var deleted = [];

    // If there's album
    if (!err && album && album.photos) {

      // New photos
      var newPhotos = [];

      album.photos.forEach(function(photo, index) {
        // If photo is in ids
        if (photoIds.indexOf(photo.id) >= 0) {
          // Add to deleted
          deleted.push(photo.id);
        } else {
          // Add to new photos
          newPhotos.push(photo);
        }
      });

      // Change photos
      album.photos = newPhotos;
      // Save
      album.save(function(err, album) {
        // Print
        if (!err) {
          done(true);

          // Delete the photos
          Photo.remove({ 
            _id: {
              '$in': deleted
            }
          }, function(err) {
            // Done
          });

        } else {
          done(false);
        }
      });
    } else {
      done(false);
    }
  });
};

mongoose.model('Album', AlbumSchema);
