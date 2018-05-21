'use strict';

angular.module('main').controller('NowController', NowController);

NowController.$inject = [
  '$rootScope',
	'$scope',
	'$resource',
	'Authentication',
	'API',
	'$state',
	'location'
];

function NowController($rootScope, $scope, $resource, Authentication, API, $state, location) {
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

  // Located
  var located = false, thereWasARequest = false, coordinates = '';
  // Do locate
  location.promise.then(function() {
    // Located
    located = true;
    // Set coordinates
    coordinates = location.current.longitude + ',' + location.current.latitude;

    // If there's was a request
    if (thereWasARequest) {
      // Do load exhibitions
      $scope.loadExhibitions();
    }
  });

  // Reset
  $scope.restart = function() {
    // Reset loaded
    $scope.loaded.length = 0;
    $scope.ended = false;
    $scope.exhibitions = [];
    $scope.current = 0;
    // Load
    return $scope.loadExhibitions();
  };

	// Populate
	$scope.loadExhibitions = function() {
    thereWasARequest = true;

    // If not located
    if (!located || !$rootScope.$currentCity) {
      // Return
      return false;
    }

    // If already in loaded
    if ($scope.loaded.indexOf($scope.current) >= 0) {
      // Return
      return false;
    }

    // Add to loaded
    $scope.loaded.push($scope.current);

    var filters = {
      start: $scope.current,
      limit: $scope.limit,
      landing: 'now',
      sort: '-recommended',
      near: coordinates,
      city: $rootScope.$currentCity.lcase
    };

    // Set busy
    $scope.busy = true;
		// Use restangular
    API.get('events', filters).then(function(response) {
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
          id: exhibition._id,
          name: exhibition.name,
          permalink: exhibition.permalink,
          artists: artists,
          date: {
            start: exhibition.startDate,
            end: exhibition.endDate
          },
          address: {
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
    // Get image ratio
    var ratio = image.dimensions.width / image.dimensions.height;
    // Return height
    return parseInt($scope.brickWidth() / ratio);
  };

  $scope.$on('$changeCity', $scope.restart);
}
