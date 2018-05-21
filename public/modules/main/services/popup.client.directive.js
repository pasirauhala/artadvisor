'use strict';

/**
 * Popup for Art Advisor
 */

angular.module('main').directive('popup', ['$rootScope', function($rootScope) {

  var link = function($scope, $element, $attributes, $controllers, $transclude) {
    // Watch an event
    $scope.$on('openPopup', function(evt, name) {
      // If name matches
      if (name === $scope.name) {
        // Show popup
        $element.addClass('open');
      }
    });
    // Close
    $scope.$on('closePopup', function(evt, name) {
      // Remove
      if (name === $scope.name) {
        // Close
        $scope.close();
      }
    });

    $scope.close = function() {
      // Remove open
      $element.removeClass('open');
      // Call close
      if ($scope.closed) {
        // Call
        console.log($scope.closed);
        $scope.$eval($scope.closed);
      }
    };

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };

  return {
    link: link,
    restrict: 'E',
    scope: {
      name: '=',
      closed: '@'
    },
    transclude: true
  };
}]);