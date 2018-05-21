'use strict';

angular.module('main').controller('ReportController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.

    $scope.loggedIn = Authentication.token;

    $scope.back = function() {
      $window.history.back();
    };

    // If no URL, go to landing page
    if (!$state.params.url) {
      $state.go('landing-now');
      return false;
    }

    $scope.input = {
      url: $state.params.url
    };
    $scope.response = {
      success: false,
      message: ''
    };
    $scope.busy = false;

    $scope.submit = function() {
      if ($scope.busy) {
        return false;
      }
      // Busy
      $scope.busy = true;
      $scope.response.success = true;
      $scope.response.message = 'Sending report';
      // API
      API.post('report', $scope.input).then(function(response) {
        // Set resonse
        $scope.busy = false;
        $scope.response.success = response.data.success;
        $scope.response.message = response.data.message;

        if (response.data.success) {
          // Empty
          $scope.input.subject = '';
          $scope.input.content = '';
          // Go back
          $scope.back();
        }
      });

    };

  }
]);