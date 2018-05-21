'use strict';

/**
 * Modal view
 * @author Ronald Borla
 */

// Modal directive
angular.module('main').directive('modal', ['$timeout', '$window', function($timeout, $window) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {

    $scope.items = [];
    $scope.item = {};
    $scope.index = $scope.index || 'id';

    var findActiveItem = function() {
      if ($scope.items && $scope.items.length > 0) {
        for (var i in $scope.items) {
          // If found
          if ($scope.items[i][$scope.index] === $scope.active) {
            // Return index
            return i;
          }
        }
      }
      return -1;
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

    // Preview
    var preview = function() {
      // Find
      var index = findActiveItem();
      // Set item
      $scope.item = (index >= 0) ? $scope.items[index] : {};
      // Adjust wrap
      adjustModalPosition();
    };

    $scope.previous = function() {
      // Set item
      var index = findActiveItem();
      // If there's any
      if (index >= 0) {
        // Subtract
        index--;
        if (index < 0) {
          index = 0;
        }
        $scope.active = $scope.items[index][$scope.index];
      } else {
        $scope.active = null;
      }
    };

    $scope.next = function() {
      // Set item
      var index = findActiveItem();
      // If there's any
      if (index >= 0) {
        // Subtract
        index++;
        if (index >= $scope.items.length) {
          index = $scope.items.length - 1;
        }
        $scope.active = $scope.items[index][$scope.index];
      } else {
        $scope.active = null;
      }
    };

    $scope.close = function() {
      // Inactive
      $scope.active = null;
    };

    var body = angular.element('body:first');
    var prevBodyOverflow = body.css('overflow');

    // Watch active
    $scope.$watch('active', function(now, prev) {
      if (now !== prev) {
        // Get now
        if ($scope.active !== null) {
          // Set body
          body.css({ overflow: 'hidden' });
          // Preview
          preview();
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
      items: '=',
      index: '=',
      active: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);