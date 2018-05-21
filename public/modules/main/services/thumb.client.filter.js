'use strict';

/**
 * Convert image source to thumb
 */
angular.module('main').filter('thumb', [function() {

  return function(input, size) {
    // If there's no input
    if (!input) {
        // Exit
        return input;
    }
    // Default size is 100
    size = (size || 100) + '';
    // Split by /
    var arrSource = input.split('/');

    // If first is "images"
    if (arrSource[0] === 'images') {
        // Prepend with uploads
        arrSource = ['', 'uploads'].concat(arrSource);
    } else if (!arrSource[0] && arrSource[1] === 'images') {
        // Insert
        arrSource.splice(1, 0, 'uploads');
    }

    // Splice
    arrSource.splice(arrSource.length - 1, 0, 'thumbs', size);
    // Join
    var thumb = arrSource.join('/');
    // Insert thumbs and size
    return thumb;
  };
}]);