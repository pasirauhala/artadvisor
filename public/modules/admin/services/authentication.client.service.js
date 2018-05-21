'use strict';

// Authentication service for token
angular.module('admin').factory('Authentication', ['$window', '$location', function($window, $location) {
  // If there's no token
  if (!$window.token || !$window.admin) {
    $window.location = '/authentication?next=/admin';
    return { token: null };
  }
  // Return token
  return {
    token: $window.token
  };
}]);
