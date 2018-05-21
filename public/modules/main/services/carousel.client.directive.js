'use strict';

/**
 * Carousel bundle
 */
angular.module('main')
  /**
   * The carousel directive
   */
  .directive('carousel', ['$q', '$timeout', function($q, $timeout) {

    var listeners = {};

    var link = function($scope, $element) {


    };

    var controller = ['$element', '$scope', function($element, $scope) {

      // Wait till ready
      var ready = $q.defer(), isReady = false;

      // Set element
      $scope.$element = $element;
      // On ready
      $scope.$ready = ready.promise;
      // Is ready
      $scope.$isReady = function() {
        // Return
        return isReady;
      };

      // Fire event
      var fireEvent = function(event, args) {
        // Loop through listeners
        if (listeners[event]) {
          listeners[event].forEach(function(item) {
            // Call
            item.apply($scope, args);
          });
        }
      };

      // On
      $scope.listen = function(event, callback) {
        // If there's no listener
        if (!listeners[event]) {
          // Create
          listeners[event] = [];
        }
        // Push
        listeners[event].push(callback);
      };

      // Get width
      $scope.width = function() {
        // Return width
        return $element.width();
      };

      $scope.control.focus = function(index) {
        // Fire focus
        fireEvent('focus', [index]);
      };

      $scope.control.ready = $scope.$ready;
      $scope.control.isReady = $scope.$isReady;

      // Watch
      $scope.$watch('width()', function(current, prev) {
        // If not yet initialized
        if (!isReady && current > 100) {
          // Initialize
          isReady = true;
          // Resolve ready
          ready.resolve($scope);

          console.log('--Carousel Width--');
          console.log(current);
        }
        // If not the same
        fireEvent('carouselWidthChanged', [current]);
      });

      return $scope;
    }];

    return {
      link: link,
      controller: controller,
      restrict: 'A',
      scope: {
        control: '=carousel'
      }
    };
  }])
  /**
   * The carousel container
   */
  .directive('carouselList', [function() {

    var link = function($scope, $element, $attributes, $parent) {

      $scope.$carousel = $parent;

    };

    var controller = ['$element', '$scope', function($element, $scope) {

      // Set element
      $scope.$element = $element;

      // Recalculate width
      $scope.recalculateWidth = function() {
        // If not ready
        if (!$scope.$carousel.$isReady()) {
          return false;
        }
        // Total width
        var totalWidth = 0;
        // Get items
        $element.find('[carousel-item], [data-carousel-item]').each(function() {
          // Increment total width
          totalWidth += angular.element(this).width();
        });
        // Set the width
        $element.css('width', totalWidth + 'px');
      };

      return $scope;
    }];

    return {
      link: link,
      controller: controller,
      restrict: 'A',
      require: '^carousel',
      scope: {
        options: '=carouselList'
      }
    };
  }])
  /**
   * The carousel item
   */
  .directive('carouselItem', [function() {

    var link = function($scope, $element, $attributes, $parent) {

      // Set list
      $scope.$list = $parent;

      // On parent ready
      $scope.$list.$carousel.$ready.then(function($carousel) {
        // Recalculate width
        $scope.recalculateWidth();
      });

      // Listen focus
      $scope.$list.$carousel.listen('focus', function(index) {
        // Check index
        console.log(index);
      });
    };

    var controller = ['$element', '$scope', function($element, $scope) {

      // Set element
      $scope.$element = $element;

      // Update width
      $scope.recalculateWidth = function() {
        // Make sure it's ready
        if (!$scope.$list.$carousel.$isReady()) {
          return false;
        }
        // Set width
        var width = $scope.$list.$carousel.width() * $scope.options.width;
        // Get carousel element width
        $element.css('width', width + 'px');
      };

      // Get width
      $scope.width = function() {
        // Return this width
        return $element.width();
      };

      $scope.$watch('options.width', function(current, prev) {
        // Update width
        $scope.recalculateWidth();
      });

      // Watch width change
      $scope.$watch('width()', function(current, prev) {
        // Recalculate list width
        $scope.$list.recalculateWidth();
      });

      return $scope;
    }];

    return {
      link: link,
      controller: controller,
      restrict: 'A',
      require: '^carouselList',
      scope: {
        options: '=carouselItem'
      }
    };
  }]);