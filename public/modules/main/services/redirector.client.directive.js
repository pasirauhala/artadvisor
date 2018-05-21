'use strict';

/**
 * Redirector
 */
angular.module('main').directive('redirector', ['$window', '$timeout', '$state', function($window, $timeout, $state) {

  var link = function($scope, $element, $attributes, $controllers, $transclude) {
    // Get seconds
    $scope.$seconds = $scope.seconds || 5;
    // The window
    var theWindow = angular.element($window);

    var reposition = function() {
      // Get window height
      var wrap = $element.find('.redirector-wrap:first'),
          marginTop = (theWindow.height() / 2) - (wrap.height() / 2);
      // Change margin Top
      wrap.css('margin-top', marginTop + 'px');
    };

    $scope.$on('windowResized', function($event) {
      // Reposition
      reposition();
    });

    var countdown = function() {
      // If less than 1
      if ($scope.$seconds <= 0) {
        // Do redirect
        $state.go($scope.state[0], $scope.state[1]);
      } else {
        // Wait first
        $timeout(function() {
          // Reduce
          $scope.$seconds--;
          // Countdown
          countdown();
        }, 1000);
      }
    };

    var redirecting = false;

    // Watch
    $scope.$watch('state', function(current, prev) {
      if (current !== prev && current && !redirecting) {
        // Do it
        redirecting = true;
        $element.addClass('show');
        // Countdown
        countdown();
      }
    });

    // Use transclude
    $transclude($scope, function(clone, scope) {
      // Replace
      $element.append(clone);
      reposition();
    });
  };

  // Return
  return {
    link: link,
    scope: {
      state: '=',
      seconds: '=?'
    },
    transclude: true,
    restrict: 'E'
  };
}]);