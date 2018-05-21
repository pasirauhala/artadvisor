'use strict';

angular.module('main').controller('ForgotPasswordController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

    $scope.email = $stateParams.email || '';
    $scope.success = true;
    $scope.message = '';
    $scope.busy = false;

    // Request
    $scope.request = function() {

      if (!angular.element.trim($scope.email)) {
        $scope.success = false;
        $scope.message = 'Email address is required';
        return false;
      }

      if ($scope.busy) {
        return false;
      }
      $scope.busy = true;
      $scope.success = true;
      $scope.message = 'Processing request';

      // Do submit
      API.post('authenticate/passwordreset', {
        email: $scope.email
      }).then(function(response) {
        // Set message
        $scope.success = response.data.success;
        $scope.message = response.data.message;

        if ($scope.success) {
          $scope.email = '';
        }
        $scope.busy = false;
      });
    };

    // If there's code
    if ($stateParams.email && $stateParams.code) {
      $scope.busy = true;
      $scope.success = true;
      $scope.message = 'Completing password reset';
      // Submit
      API.post('authenticate/passwordreset', {
        email: $stateParams.email,
        code: $stateParams.code
      }).then(function(response) {
        // Set message
        $scope.success = response.data.success;
        $scope.message = response.data.message;
        $scope.busy = false;
      });
    }

  }
]);