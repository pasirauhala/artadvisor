'use strict';

/**
 * Share
 * @author Ronald Borla
 */

// Modal directive
angular.module('main').directive('share', ['$timeout', '$window', '$state', function($timeout, $window, $state) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {

    $scope.target = $state.href($state.current.name, $state.params, { absolute: true });

    $scope.close = function() {
      // Close
      $scope.active = false;
    };

    var adjustModalPosition = function() {
      // Get wrap
      var wrap = $element.find('.wrap:first');
      // Get window and wrap height
      var winHeight = angular.element($window).height(),
          wrapHeight = wrap.height();
      // Set top
      wrap.css('top', ((winHeight / 2) - (wrapHeight / 2)) + 'px');
    };

    var body = angular.element('body:first');
    var prevBodyOverflow = body.css('overflow');

    $scope.$watch('active', function(current, prev) {
      if (current !== prev) {
        // Get now
        if ($scope.active) {
          // Set body
          body.css({ overflow: 'hidden' });
          adjustModalPosition();
        } else {
          // Remove 
          body.css({ overflow: prevBodyOverflow });
        }
      }
    });

    angular.element($window).on('resize', function() {
      adjustModalPosition();
    });

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };

  // Return directive
  return {
    link: link,
    scope: {
      active: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);