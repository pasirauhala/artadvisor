'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  fs = require('fs'),
  mkdirp = require('mkdirp'),
  moment = require('moment'),
  generator = require('./helpers/generator.server.helper');

exports.upload = {

  /**
   * Generate filename
   */
  filename: function(path, extension, filename, done, count) {
    // Final
    var finalName = filename + (count ? ('-' + count) : '');
    // Combine
    var fullname = path + finalName + '.' + extension;
    // If exists
    fs.exists(fullname, function(exists) {
      // If exists
      if (exists) {
        // Generate again
        exports.upload.filename(path, extension, filename, done, count ? (count + 1) : 2);
      } else {
        // Complete
        if (done) {
          done(finalName);
        }
      }
    });
  },

  // Process
  process: function(file, done) {
    // If there's no file
    if (!file) {
      done({ success: false, message: 'File not found' });
    } else {
      // Get temp
      var temp = file.path;
      // Set short path
      var shortPath = 'uploads/' + moment().format('YYYY-MM-DD') + '/';
      // Create destination
      var dest = './public/' + shortPath;
      // Create dest
      mkdirp(dest, function(err) {
        // If there's error
        if (err) {
          done({ success: false, message: 'Failed to create directory: ' + dest, error: err });
        } else {
          // Get extension
          var extension = '';

          var lastdot = file.originalname.lastIndexOf('.');
          if (lastdot >= 0) {
            // Get it
            extension = file.originalname.substr(lastdot + 1);
          }
          
          // Set filename
          var filename = file.originalname.substr(0, file.originalname.length - extension.length - 1);

          // Generate a filename
          exports.upload.filename(dest, extension, generator.filename(filename), function(finalName) {
            // Full final
            var fullFinal = finalName + '.' + extension;
            // Full filename
            var fullFilename = dest + fullFinal;
            // Copy file
            fs.rename(temp, fullFilename, function(err) {
              // Error
              if (err) {
                // Send response
                done({ success: false, message: 'Failed to upload file' });
              } else {
                // Delete temporary file
                fs.unlink(temp, function(err) {
                  // Response
                  done({ 
                    success: true, 
                    message: 'File successfully uploaded',
                    file: {
                      path: shortPath,
                      name: fullFinal,
                      full: shortPath + fullFinal
                    }
                  });
                });
              }
            });
          });
        }
      });
    }
  },

  /**
   * Get all users
   */
  index: function(req, res) {
    // Do process
    exports.upload.process(req.file, function(data) {
      // Print
      res.json(data);
    });
  }

};