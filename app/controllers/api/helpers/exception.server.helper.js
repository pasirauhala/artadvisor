'use strict';

/**
 * API Exceptions
 */

// Set codes
var errorCodes = {
  // General
  general: {
    // Bad request
    status: 400,
    // List
    codes: [
      {
        code: 100,
        message: 'Unknown error'
      }
    ]
  },
  // Unauthorized
  unauthorized: {
    // Status
    status: 401,
    // List
    codes: [
      {
        code: 200,
        message: 'Unauthorized'
      },
      {
        code: 201,
        message: 'Invalid token'
      },
      {
        code: 202,
        message: 'Missing token'
      },
      {
        code: 203,
        message: 'Admin privilege only'
      }
    ]
  },
  // Missing
  input: {
    // Status
    status: 400,
    // List
    codes: [
      {
        code: 300,
        message: 'Missing input'
      }
    ]
  },
  // Not found
  notFound: {
    // 404
    status: 404,
    // List
    codes: [
      {
        code: 400,
        message: 'Not found'
      }
    ]
  }
};

// Get exception by code
var getExceptionByCode = function(code) {
  // Parse int
  code = parseInt(code);
  // Loop through codes
  for (var groupName in errorCodes) {
    // Get group
    var group = errorCodes[groupName];
    // Loop through codes
    for (var i in group.codes) {
      // Get code
      var errorCode = group.codes[i];
      // If found
      if (parseInt(errorCode.code) === code) {
        // Return code with status
        errorCode.status = group.status;
        errorCode.group = groupName;
        return errorCode;
      }
    }
  }
  // Return null
  return getExceptionByCode(100);
};

module.exports = function(errorCode, customMessage, customStatus) {
  // Get exception
  var exception = getExceptionByCode(errorCode);
  // If there's custom message
  if (customMessage) {
    // Overwrite
    exception.message = customMessage;
  }
  // If there's custom status
  if (customStatus) {
    // Overwrite
    exception.status = customStatus;
  }
  // Return exception
  return exception;
};