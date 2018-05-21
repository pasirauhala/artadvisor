'use strict';

angular.module('main').controller('ProfileController', ['$window', '$scope', '$resource', '$state', 'Authentication', 'API', 'moment', '$timeout',
  function($window, $scope, $resource, $state, Authentication, API, moment, $timeout) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    // Set user
    $scope.user = null;

    $scope.increment = 5;

    $scope.show = {
      exhibitions: 5,
      artists: 5,
      venues: 5,

      activeExhibitions: 0,
      inactiveExhibitions: 0,

      showingInactive: false,

      activate: function(name) {
        $scope.favorites.active = name;
        $scope.show.exhibitions = 5;
        $scope.show.venues = 5;
      },
      more: function() {

        var increment = $scope.increment;

        if ($scope.favorites.active === 'exhibitions') {
          // If not showing inactive
          if (!$scope.show.showingInactive && 
              (($scope.show[$scope.favorites.active] + increment) > $scope.show.activeExhibitions)) {
            // Change increment
            increment = $scope.show.activeExhibitions - $scope.show[$scope.favorites.active];
            // Showing inactive
            $scope.show.showingInactive = true;
          }
        }

        // Increment
        $scope.show[$scope.favorites.active] += increment;
      },
      hasMore: function() {
        return $scope.user && 
               $scope.user.favorites && 
              ($scope.show[$scope.favorites.active] < $scope.user.favorites[$scope.favorites.active].length);
      }
    };

    $scope.showManaged = {
      exhibitions: 5,
      venues: 5,
      activate: function(name) {
        $scope.manage.active = name;
        $scope.showManaged.exhibitions = 5;
        $scope.showManaged.venues = 5;
      },
      more: function() {
        // Increment
        $scope.showManaged[$scope.manage.active] += $scope.increment;
      },
      hasMore: function() {
        return $scope.user && 
               $scope.user[$scope.manage.active] && 
              ($scope.showManaged[$scope.manage.active] < $scope.user[$scope.manage.active].length);
      }
    };

    $scope.artCache = $window.artCache;

    var getHiddenIds = function() {
      var ids = [], hidden = $scope.user ? ($scope.user.hiddenArtCache || []) : [];
      for (var i in hidden) {
        ids.push(hidden[i]._id || hidden[i]);
      }
      // Return
      return ids;
    };

    $scope.hiddenArtCache = function(artCache) {
      var hidden = getHiddenIds();

      for (var i in hidden) {
        if (artCache._id === hidden[i]) {
          // Return
          return true;
        }
      }
      return false;
    };
    $scope.toggleArtCache = function(artCache) {
      var hidden = getHiddenIds(),
          hide = !$scope.hiddenArtCache(artCache);

      if (hide) {
        hidden.push(artCache._id);
      } else {
        var index = hidden.indexOf(artCache._id);
        hidden.splice(index, 1);
      }

      // Update me
      API.put('me', { user: { hiddenArtCache: hidden } }).then(function(response) {
        $scope.user.hiddenArtCache = response.data.hiddenArtCache;
        $scope.$emit('userChanged', $scope.user);
      });
    };

    $scope.manage = {
      active: 'exhibitions',
      getSingle: function(name) {
        return name.substr(0, name.length - 1);
      },
      createNew: function() {
        $state.go($scope.manage.getSingle($scope.manage.active) + '-create');
      },
      getName: function(name) {
        // Get single
        var single = $scope.manage.getSingle(name);
        if (single === 'exhibition') {
          single = 'event';
        }
        return single;
      },
      getTitle: function(name) {
        if (name === 'exhibitions') {
          name = 'events';
        }
        var title = name.substr(0, 1).toUpperCase() + name.substr(1);
        return 'My ' + title;
      },
      names: ['exhibitions', 'venues']
    };

    $scope.favorites = {
      active: 'exhibitions',
      getName: function(name) {
        if (name === 'exhibitions') {
          name = 'events';
        }
        return name.substr(0, 1).toUpperCase() + name.substr(1);
      },
      names: ['exhibitions', 'artists', 'venues']
    };

    $scope.venue = {

      unfavorite: function(venue) {
        // Are you sure
        if (!confirm('Are you sure you want to remove the selected venue from your favorites?')) {
          // Return
          return false;
        }
        // Do unfavorite
        API.delete('venues/' + venue.permalink + '/favorite').then(function(response) {
          // Remove
          for (var i in $scope.user.favorites.venues) {
            if ($scope.user.favorites.venues[i]._id === venue._id) {
              // Remove
              $scope.user.favorites.venues.splice(i, 1);
              break;
            }
          }
        });
      }
    };

    $scope.exhibition = {

      unfavorite: function(exhibition) {
        // Are you sure
        if (!confirm('Are you sure you want to remove the selected event from your favorites?')) {
          // Return
          return false;
        }
        // Do unfavorite
        API.delete('events/' + exhibition.permalink + '/favorite').then(function(response) {
          // Remove
          for (var i in $scope.user.favorites.exhibitions) {
            if ($scope.user.favorites.exhibitions[i]._id === exhibition._id) {
              // Remove
              $scope.user.favorites.exhibitions.splice(i, 1);
              break;
            }
          }
        });
      }
    };

    // Get user
    $scope.getLoggedInUser = function(done) {
      // Query
      API.get('me/profile').then(function(response) {
        // Set user
        $scope.user = response.data || null;
        // If there's no favorites
        if (!$scope.user.favorites) {
          // Set it
          $scope.user.favorites = {
            exhibitions: [],
            artists: [],
            venues: []
          };
        }
        // Once done
        if (done) {
          done($scope.user);
        }
      });
    };

    // Get logged in
    $scope.getLoggedInUser(function(user) {

      // Active
      var activeExhibitions = [],
          inactiveExhibitions = [];
      // Loop
      if (user.favorites.exhibitions) {
        for (var i in user.favorites.exhibitions) {
          // If active
          if (user.favorites.exhibitions[i].active) {
            // Add to active
            activeExhibitions.push(user.favorites.exhibitions[i]);
          } else {
            // Add to inactive
            inactiveExhibitions.push(user.favorites.exhibitions[i]);
          }
        }
      }
      // Set
      $scope.show.activeExhibitions = activeExhibitions.length;
      $scope.show.inactiveExhibitions = inactiveExhibitions.length;
      // Overwrite
      user.favorites.exhibitions = activeExhibitions.concat(inactiveExhibitions);
    });
    
  }
]);