'use strict';

angular.module('main').controller('FavoritesController', ['$rootScope', '$scope', '$resource', 'Authentication', 'API',
  function($rootScope, $scope, $resource, Authentication, API) {
    // This provides Authentication context.
    $scope.auth = Authentication;

    $scope.exhibitions = [];
    $scope.current = 0;
    $scope.limit = 10;

    $scope.favorite = function(exhibition) {
      // Set endpoint
      var endpoint = 'events/' + exhibition.permalink + '/favorite';
      // Action
      var action = exhibition.favorited ? API.delete(endpoint) : API.post(endpoint);
      // After action
      action.then(function(response) {
        // If success
        if (response.data.success) {
          exhibition.favorited = !exhibition.favorited;
        }
      });
    };

    $scope.recommend = function(exhibition) {
      // Set endpoint
      var endpoint = 'events/' + exhibition.permalink + '/recommend';
      // Action
      var action = exhibition.recommended ? API.delete(endpoint) : API.post(endpoint);
      // After action
      action.then(function(response) {
        // If success
        if (response.data.success) {
          exhibition.recommended = !exhibition.recommended;
        }
      });
    };

    $scope.ended = false;

    $scope.busy = false;

    // Loaded
    $scope.loaded = [];

    // Populate
    $scope.loadExhibitions = function() {

      // If already in loaded
      if ($scope.loaded.indexOf($scope.current) >= 0) {
        // Return
        return false;
      }

      // Add to loaded
      $scope.loaded.push($scope.current);

      // Use restangular
      API.get('me/favorites/events', {
        start: $scope.current,
        limit: $scope.limit
      }).then(function(response) {
        // Get data
        var data = response.data;

        if (!data.data.length) {
          // Ended
          $scope.ended = true;
        }

        // If there's cities
        if (data.cities) {
          // Activate
          $rootScope.$broadcast('$activateCities', data.cities || []);
        }

        // Loop through exhibitions
        for (var i = 0; i < data.data.length; i++) {
          // Get exhibition
          var exhibition = data.data[i];
          // Get artists
          var artists = [];
          // Loop through artists
          for (var j in exhibition.artists) {
            // Get artist full name
            artists.push(exhibition.artists[j].user ? exhibition.artists[j].user.fullname : exhibition.artists[j].nonUser.fullname);
          }
          // Append
          $scope.exhibitions.push({
            name: exhibition.name,
            permalink: exhibition.permalink,
            artists: artists,
            date: {
              start: exhibition.startDate,
              end: exhibition.endDate
            },
            address: {
              city: exhibition.venue.address.city,
              lang: exhibition.venue.address.lang,
              full: exhibition.venue.address.line1 || '',
              coordinates: exhibition.venue.address.coordinates || {},
              distance: '250m'
            },
            venue: exhibition.venue,
            image: {
              dimensions: {
                width: exhibition.gallery.photos[0].photo.width,
                height: exhibition.gallery.photos[0].photo.height
              },
              thumb: '',
              medium: root + exhibition.gallery.photos[0].photo.source,
              large: ''
            },
            open: 'Open today from 12 to 18',
            openingHours: exhibition.openingHours,
            specialHours: exhibition.specialHours,
            favorited: exhibition.favorite,
            recommended: exhibition.recommend
          });
          // Increment
          $scope.current++;
        }
        // Reduce limit to 3
        $scope.limit = 3;
        $scope.busy = false;
      });
    };

    $scope.brickHeight = function(image) {
      // Set width
      var width = 0;
      // Get device
      switch (device) {
        case 'extraLargeDesktop': width = 296; break;
        case 'largeDesktop': width = 326; break;
        case 'desktop': width = 339; break;
        case 'tablet': width = 328; break;
        case 'mobile': width = 270; break;
      }
      // Get image ratio
      var ratio = image.dimensions.width / image.dimensions.height;
      // Return height
      return width / ratio;
    };
  }
]);
