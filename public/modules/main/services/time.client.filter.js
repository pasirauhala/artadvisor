'use strict';

/**
 * Time filter
 */
angular.module('main').filter('time', [function() {

  // Return
  return function(input) {

    if (!input) {
      return '';
    }

    while (input.length < 4) {
      input = '0' + input;
    }

    //if (input.length === 4) {
      return input.substr(0, 2) + ':' + input.substr(2);
    //} else {
    //  return input;
    //}
  };
}]);