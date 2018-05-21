'use strict';

// API Service
angular.module('main').service('API', ['$http', '$state', '$q', 'Authentication', function($http, $state, $q, Authentication) {
  // Set this
  var _this = this;
  // Set api root
  this.root = '/api/';
  // Cleanup endpoint
  var cleanEndPoint = function(endpoint) {
    return _this.root + (endpoint.charAt(0) === '/' ? endpoint.substr(1) : endpoint);
  };
  // Embed token
  var embedToken = function(query) {
    // Set token
    if (Authentication.token) {
      query.token = Authentication.token;
    }
    return query;
  };

  // Exception handler
  var handleException = function(exception, response) {
    // Select group
    switch (exception.group) {
      // If general
      case 'general':
        // Alert
        console.log(response);
        alert(exception.message);
        break;
      // If unauthorized
      case 'unauthorized':
        // Clear token
        Authentication.token = null;
        // Redirect to login page with error message
        $state.go('authentication', {
          action: 'login',
          message: 'Please login',
          next: $state.href($state.current.name, $state.params)
        });
        break;
    }
    // Return exception
    return exception;
  };

  // Filter
  var filter = function(promise) {
    // Defer
    var deferred = $q.defer();
    // Check
    promise.then(function(response) {
      // Resolve
      deferred.resolve(response);
    }, function(response) {
      // Handle exception
      if (response.data && response.data.exception) {
        deferred.reject(handleException(response.data.exception, response));
      }
    });
    // Return promise
    return deferred.promise;
  };

  // Perform get
  this.get = function(endpoint, query) {
    // Do get
    return filter($http.get(cleanEndPoint(endpoint), { params: embedToken(query || {}) }));
  };
  this.post = function(endpoint, data, query) {
    // Do post
    return filter($http.post(cleanEndPoint(endpoint), data, { params: embedToken(query || {}) }));
  };
  // Perform put
  this.put = function(endpoint, data, query) {
    // Do put
    return filter($http.put(cleanEndPoint(endpoint), data, { params: embedToken(query || {}) }));
  };
  // Perform delete
  this.delete = function(endpoint, query) {
    // Do delete
    return filter($http.delete(cleanEndPoint(endpoint), { params: embedToken(query || {}) }));
  };

}]);
