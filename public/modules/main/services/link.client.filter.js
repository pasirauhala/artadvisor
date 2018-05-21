'use strict';

/**
 * Link
 */
angular.module('main').filter('link', [function() {

  return function(input) {

    if (!input) {
      return input;
    }

    var prefix = 'http';

    // Convert url as link
    if (input.toLowerCase().substr(0, prefix.length) !== prefix) {
      // Prepend prefix
      input = prefix + '://' + input;
    }
    // Return
    return input;
  };
}]);