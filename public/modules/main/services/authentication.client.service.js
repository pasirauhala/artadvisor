'use strict';

// Authentication service for token
angular.module('main').factory('Authentication', ['$window', '$q', '$http', function($window, $q, $http) {
  // Load user
  var user = null;

  // Set authentication
  var authentication = {
    token: $window.token,
    user: null,
    promise: null
  };

  /**
   * Initialize a promise
   */
  authentication.swear = function() {
    // Create promise
    var deferred = $q.defer();
    // Get user
    $http.get('/api/me', { params: { token: $window.token } }).then(function(response) {
      // Make sure there's no exception
      if (!response.data.exception) {
        // Set user
        authentication.user = response.data;
      }
      // Resolve
      deferred.resolve(authentication);
    });
    // Set promise
    authentication.promise = deferred.promise;
    // Return
    return authentication;
  };

  // Swear and return authentication
  return authentication.swear();
}]);
