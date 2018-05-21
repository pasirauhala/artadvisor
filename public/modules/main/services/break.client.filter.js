'use strict';

angular.module('main').filter('break', ['$sce', function($sce) {
  // Return function
  return function(input, at) {
    // If there's no at
    if (typeof at === 'undefined') {
      at = 1;
    }
    // Split by spaces
    var spaces = input.split(' ');
    // Pre
    var pre = [], post = [];
    // Loop through spaces
    for (var i = 0; i < at; i++) {
      pre.push(spaces[i]);
    }
    for (var j = at; j < spaces.length; j++) {
      post.push(spaces[j]);
    }
    // Result
    var result = pre.join(' ');
    // If there's post
    if (post.length) {
      result += '<br />' + post.join(' ');
    }
    // Return
    return $sce.trustAsHtml(result);
  };
}]);