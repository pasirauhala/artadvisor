'use strict';

// Middleware service for token
angular.module('main').service('Middleware', ['Authentication', '$state', function(Authentication, $state) {
  // Return middleware
  var filters = {
    // Must not be logged in
    notLoggedIn: function(state, params) {
      if (!Authentication.token) {
        // Exit
        return true;
      }
      $state.go('landing-now');
      return false;
    },
    // Must be logged in
    loggedIn: function(state, params) {
      if (Authentication.token) {
        // Redirect to authentication
        return true;
      }
      $state.go('authentication', {
        next: $state.href(state.name, params)
      });
      return false;
    }
  };

  this.filter = function(state, params) {
    // If there's no filter
    if (!state || !state.filters) {
      return true;
    }
    // Loop through filters
    for (var i in state.filters) {
      // Call
      if (!filters[state.filters[i]](state, params)) {
        return false;
      }
    }
    return true;
  };

}]);
