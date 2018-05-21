'use strict';

/**
 * Location
 */
angular.module('main').directive('location', [function() {

  var link = function($scope, $element, $attributes, $parents, $transclude) {

    // Open
    $scope.unavailable = false;

    $transclude($scope, function(clone, scope) {
      // Replace
      $element.html(clone);

      // On error
      $scope.$on('error', function($event, message) {
        // Set 
        // $scope.unavailable = true;
      });
    });
  };

  return {
    link: link,
    restrict: 'A',
    transclude: true
  };
}]);