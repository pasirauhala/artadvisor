'use strict';

/**
 * Check network connectivity
 */
angular.module('main').directive('offline', ['$rootScope', '$window', function($rootScope, $window) {

  var link = function($scope, $element, $attributes, $parents, $transclude) {

    // Open
    $scope.offline = false;

    // State changed
    var networkStateChange = function(online) {
      // Call
      $rootScope.$broadcast('networkStateChange', online);
      // Set offline
      $scope.offline = !online;
    };

    // On online
    $window.Offline.on('up', function() {
      // Call
      networkStateChange(true);
    });
    // On offline
    $window.Offline.on('down', function() {
      // Call
      networkStateChange(false);
    });

    $transclude($scope, function(clone, scope) {
      // Replace
      $element.html(clone);
    });
  };

  return {
    link: link,
    restrict: 'A',
    transclude: true
  };
}]);