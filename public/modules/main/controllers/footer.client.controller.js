'use strict';

angular.module('main').controller('FooterController', ['$scope', '$state', '$element', '$window',
  function($scope, $state, $element, $window) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    // Set state
    $scope.$state = null;

    $scope.show = function() {
      // If no status
      if (!$scope.$state || !$scope.$state.name) {
        // False
        return false;
      }
      var pages = [
        'authentication',
        'profile',
        // Landing pages
        'landing-artview', 'landing-artcache', 'landing-now', 'landing-favorites', 'landing-lastchance', 
        'exhibition',
        'artist'
      ];
      return pages.indexOf($scope.$state.name) >= 0;
    };

    // When state changes
    $scope.$on('stateChanged', function(event, args) {
      // Set new state
      $scope.$state = args.toState;
    });

  }
]);