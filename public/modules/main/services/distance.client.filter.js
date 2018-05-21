'use strict';

/**
 * Distance filter
 */

angular.module('main').filter('distance', ['location', function(location) {
  // Return
  return function(input) {
    // Get distance
    var distance = location.distance(input);
    // Return
    return location.format(distance);
  };
}]);