'use strict';

/**
 * Money filter
 */

angular.module('main').filter('money', [function() {
  // Set euro
  var euro = '€';

  return function(input) {
    // If nothing
    if (!input) {
      // Set as free
      input = 'Free';
    }
    // Return
    return input;

    /*
    // Check first character
    if (input.charAt(0) === euro || input.toLowerCase() === 'free') {
      // Return
      return input;
    }
    // Just prepend euro
    return euro + ' ' + input;
    */
  };
}]);