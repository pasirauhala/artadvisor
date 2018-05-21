'use strict';

angular.module('main').controller('InviteController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

    $scope.input = {};
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
      $scope.response.message = 'Sending invitations';
      // API
      API.post('invite', $scope.input).then(function(response) {
        // Set resonse
        $scope.busy = false;
        $scope.response.success = response.data.success;
        $scope.response.message = response.data.message;

        if (response.data.success) {
          // Empty
          $scope.input.emails = '';
        }
      });

    };

  }
]);