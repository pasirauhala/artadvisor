'use strict';

var mongoose = require('mongoose'),
    moment = require('moment'),
    exception = require('./exception.server.helper');

/**
 * Json
 */
exports.json = function(res, data, status) {
  // If there's status
  if (status) {
    // Set status
    res.status(status);
  }
  // Set header
  res.header('Content-Type', 'text/json; charset=utf-8');
  res.send(JSON.stringify(data || {}, null, 4));
};

/**
 * Show model
 */
exports.showModel = function(res, err, model, inject, modify) {
  // If there's no model
  if (err || !model) {
    // Error (not found)
    exports.error(res, 400);
  } else {
    // Show
    var data = model.toJSON();
    // Loop through inject
    if (inject) {
      for (var i in inject) {
        // Add to data
        data[i] = inject[i];
      }
    }

    // Modify model by callback
    if (modify) {
      // Call modify, pass data
      modify(data);
    }

    // Send json
    exports.json(res, data);
  }
};

/**
 * Success
 */
exports.success = function(res, message, error) {
  // Call json
  exports.json(res, {
    success: !error,
    message: message
  });
};

/**
 * Data
 */
exports.data = function(res, data) {
  // Call json
  exports.json(res, {
    success: true,
    data: data
  });
};

/**
 * Error
 */
exports.error = function(res, code, message, status) {
  // Get exception
  var error = exception(code, message, status);
  // Send error
  exports.json(res, { 
    data: {}, 
    exception: error,
  },
  // HTTP status
  error.status);
  // Return false
  return false;
};

/**
 * Query
 */
exports.query = function(done, Model, filters, fields, query, populate, inject, injectProperty) {
  // Set start
  var start = query.start || 0,
      limit = query.limit || 20,
      sort = query.sort || {};
      
  var returnData = function(allFields) {

    // Get json
    var json = [];
    for (var l in allFields.data) {
      json.push(allFields.data[l].toJSON());
    }

    // If there's injectProperty
    if (injectProperty) {
      // Loop through docs
      for (var j in json) {
        // Loop through injectProperty
        for (var k in injectProperty) {
          // If callback
          if (typeof injectProperty[k] === 'function') {
            // Call function
            json[j][k] = injectProperty[k](allFields.data[j]);
          } else {
            // Else just inject
            json[j][k] = injectProperty[k];
          }
        }
      }
    }

    allFields.data = json;

    // If there's inject
    if (inject) {
      // Inject data
      for (var i in inject) {
        allFields[i] = inject[i];
      }
    }
    
    // Filter data
    if (query['return'] && allFields[query['return'].toLowerCase()]) {
      // Return
      done(null, allFields[query['return'].toLowerCase()]);
    } else {
      // Return all
      done(null, allFields);
    }
  };

  // Count
  Model.find(filters).count(function(err, count) {
    // If there's error
    if (err) {
      // Send error
      done('Error counting results');
      // Return
      return false;
    }
    // If empty
    if (!count) {
      returnData({
        data: [],
        count: 0
      });
      // Exit
      return false;
    }
    // Set options
    var options = {
      skip: start,
      limit: limit,
      sort: sort
    };
    // Do query
    Model.find(filters, fields, options)
    // Use dee populate
    .deepPopulate(populate || [])
    // Execute query
    .exec(function(err, docs) {
      // If there's error
      if (err) {
        // Error
        done('Error retrieving documents');
      } else {

        returnData({
          data: docs,
          count: count
        });
      }
    });
  });
};

/**
 * Query
 */
exports.find = function(res, Model, filters, fields, query, populate, inject, injectProperty) {
  // Do query
  exports.query(function(err, response) {
    // If there's error
    if (err) {
      exports.error(res, 'Error retrieving documents');
    } else {
      exports.json(res, response);
    }
  }, Model, filters, fields, query, populate, inject, injectProperty);
};

/**
 * All
 */
exports.all = function(res, Model) {
  // Find
  Model.find({ }).exec(function(err, models) {
    // Print
    exports.json(res, models || []);
  });
};