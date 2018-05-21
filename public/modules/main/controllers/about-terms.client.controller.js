'use strict';

angular.module('main').controller('AboutTermsController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

  }
]);