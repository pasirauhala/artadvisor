'use strict';

/**
 * Gmap
 * @author Ronald Borla
 */

// Calendar directive
angular.module('main').directive('gmap', ['uiGmapGoogleMapApi', '$timeout', function(uiGmapGoogleMapApi, $timeout) {

  // Set map
  var _this = this, map = null;

  // Responsive
  var responsive = false, responsiveCenter = {};

  /**
   * Link
   */
  var link = function($scope, $element) {

    // Wait for google maps to initialize
    uiGmapGoogleMapApi.then(function(maps) {
      // Set options
      var options = angular.element.extend({}, $scope.options);

      // If there's latitude and longitude
      if ($scope.latitude && $scope.longitude) {
        // Set to options
        options.center = new maps.LatLng($scope.latitude, $scope.longitude);
      }
      // If there's zoom
      if ($scope.zoom) {
        // Set zoom
        options.zoom = $scope.zoom;
      }
      // Set responsive
      if ($scope.responsive) {
        responsive = $scope.responsive ? true : false;
      }

      // Initialize map
      map = new maps.Map($element.find('div:first')[0], options);

      // Add listener
      maps.event.addListener(map, 'center_changed', function() {
        // If there's change
        if ($scope.change) {
          // Call change
          $scope.change(map);
        }
        /**
         * I don't know why, but this fixes the binding
         */
        $timeout(function() {
          // Get center
          var center = map.getCenter();
          // Set it
          $scope.latitude = center.lat();
          $scope.longitude = center.lng();
          $scope.zoom = map.getZoom();
        }, 1);
      });

      // If responsive
      if (responsive) {

        // Set listener
        maps.event.addDomListener(window, 'resize', function() {
          // Set currentCenter
          map.setCenter(responsiveCenter);
        });
        maps.event.addListener(map, 'idle', function() {
          // Set center
          responsiveCenter = map.getCenter();
        });

      }

      // Loaded
      maps.event.addListener(map, 'tilesloaded', function() {
        // Call loaded
        if ($scope.loaded) {
          // Call loaded
          $scope.loaded(map);
        }
      });

      // If there's init
      if ($scope.init) {
        // Call init
        $scope.init(maps, map);
      }
    });

  };

  // Return directive
  return {
    link: link,
    scope: {
      options: '=',
      latitude: '=',
      longitude: '=',
      zoom: '=',
      init: '=',
      loaded: '=',
      change: '=',
      responsive: '@'
    },
    restrict: 'E',
    template: '<div></div>'
  };
}]);