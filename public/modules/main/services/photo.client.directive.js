'use strict';

/**
 * User photo directive
 */

angular.module('main').directive('photo', ['Authentication', function(Authentication) {

  var link = function($scope, $element) {
    // Set user
    $scope.user = $scope.user || null;
    // Set background image first to empty
    $element.css('background-image', '');

    // Set source
    var setSource = function() {
      // If still no source
      if (!$scope.user.photo || !$scope.user.photo.source) {

        $element.removeClass('sourced');
        // Exit
        return false;
      }
      // Set source
      var source = $scope.user.photo.source;
      // If first character is not /
      if (source.charAt(0) !== '/') {
        // Set it
        source = '/' + source;
      }
      // Add url
      source = 'url(\'' + source.replace('\'', '\\\'') + '\')';
      // Set photo
      $element.css('background-image', source)
              .addClass('sourced');
    };

    // If there's no user
    if (!$scope.user) {
      // Get user
      Authentication.promise.then(function() {
        // Set user
        $scope.user = Authentication.user;
      });
    }

    // Watch user
    $scope.$watch('user', function(current, prev) {
      // Make sure there's user
      if ($scope.user && $scope.user.photo) {
        // Set source
        setSource();
      }
    });
  };

  return {
    link: link,
    scope: {
      user: '=?'
    },
    restrict: 'E'
  };
}]);