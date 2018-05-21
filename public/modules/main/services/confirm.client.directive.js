'use strict';

/**
 * Redirector
 */
angular.module('main').directive('confirm', ['$window', '$timeout', '$state', function($window, $timeout, $state) {

  var link = function($scope, $element, $attributes, $controllers, $transclude) {
    // The window
    var theWindow = angular.element($window);

    var reposition = function() {
      // Get window height
      var wrap = $element.find('.confirm-wrap:first'),
          marginTop = (theWindow.height() / 2) - (wrap.height() / 2);
      // Change margin Top
      wrap.css('margin-top', marginTop + 'px');
    };

    $scope.$on('windowResized', function($event) {
      // Reposition
      reposition();
    });

    $scope.$cancel = function() {
      // Remove show
      $scope.show = false;
    };

    // Watch
    $scope.$watch('show', function(current, prev) {
      // If true
      if (current !== prev) {
        // Show
        if (current) {
          // Add
          $element.addClass('show');
          reposition();
        } else {
          // Remove
          $element.removeClass('show');
        }
      }
    });

    // Use transclude
    $transclude($scope, function(clone, scope) {
      // Replace
      $element.append(clone);
    });
  };

  // Return
  return {
    link: link,
    scope: {
      action: '=',
      show: '='
    },
    transclude: true,
    restrict: 'E'
  };
}]);