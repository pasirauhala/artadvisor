'use strict';

angular.module('main').controller('VenueController', VenueController);

VenueController.$inject = [
	'$rootScope',
	'$window',
	'$timeout',
	'$scope',
	'$resource',
	'$state',
	'MapOptions',
	'API',
	'MapResponsive',
	'Authentication'
];

function VenueController($rootScope, $window, $timeout, $scope, $resource, $state, MapOptions, API, MapResponsive, Authentication) {
  // This provides Authentication context.
  $scope.authentication = Authentication;
  // Set venue
  $scope.venue = {};

  $scope.commentSource = '';

  $scope.touch = new Touch();
  // Map
  $scope.map = {
    options: MapOptions,
    center: {
      latitude: 60.17332440000001,
      longitude: 24.9410248
    },
    zoom: 15,
    marker: {
      icon: {
        url: $window.location.origin + root + '/images/marker.png'
      },
      options: {
        title: '',
        labelContent: '',
        labelClass: 'markerLabel',
        labelAnchor: '150 46'
      }
    },
    control: {}
  };

  $scope.modal = {
    id: null,
    index: 'id',
    items: [],
    set: function(items, index, id) {
      $timeout(function() {
        $scope.modal.items = items;
        $scope.modal.index = index;
        $scope.modal.id = id;
      }, 1);
    }
  };

  $scope.share = {
    active: false,
    show: function() {
      $scope.share.active = true;


    }
  };

  $scope.menu = {
    back: function() {
    	return /*$rootScope.previousState ? $state.go($rootScope.previousState) :*/ $state.go('landing-now');
    },
    others: function() {
      // Go to report page
      $state.go('report', { url: $state.href($state.current.name, $state.params) });
    },
    recommended: false,
    favorited: false,
    recommend: function() {
      // Set endpoint
      var endpoint = 'venues/' + $state.params.permalink + '/recommend';
      // Action
      var action = $scope.menu.recommended ? API.delete(endpoint) : API.post(endpoint);
      // After action
      action.then(function(response) {
        // If success
        if (response.data.success) {
          $scope.menu.recommended = !$scope.menu.recommended;
        }
      });
    },
    favorite: function() {
      // Set endpoint
      var endpoint = 'venues/' + $state.params.permalink + '/favorite';
      // Action
      var action = $scope.menu.favorited ? API.delete(endpoint) : API.post(endpoint);
      // After action
      action.then(function(response) {
        // If success
        if (response.data.success) {
          $scope.menu.favorited = !$scope.menu.favorited;
        }
      });
    },
    share: function() {

    },
    map: function() {
      // Go to map page
      $state.go('map', { venue: $scope.venue.permalink });
    }
  };

  MapResponsive.setCenter('map', $scope.map.center)
    .initialize('map', $scope.map.control);

  $scope.showAll = false;
  $scope.showExhibition = function($index) {
    // Convert
    $scope.venue.exhibitions[$index].active = !!$scope.venue.exhibitions[$index].active;
    // Check if active
    return ($scope.venue.exhibitions[$index].active !== $scope.showAll);
  };

  // Load
  $scope.loadVenue = function(done) {
    // Get
    API.get('venues/' + $state.params.permalink).then(function(response) {

      var data = response.data;
      // If there's no id
      if (!data._id || !data.id) {
        // Redirect
        $state.go('404');
        return false;
      }

      // Change comment source
      $scope.commentSource = 'venues/' + data.permalink + '/comments';

      // Set center
      $scope.map.center.latitude = data.address.coordinates.latitude;
      $scope.map.center.longitude = data.address.coordinates.longitude;

      MapResponsive.setCenter('map', data.address.coordinates);

      // Set favorite
      $scope.menu.favorited = data.favorite;
      // Set recommended
      $scope.menu.recommended = data.recommend;

      // Set label
      $scope.map.marker.options.title = data.name;
      $scope.map.marker.options.labelContent = data.name;
      // Set venue
      $scope.venue = {
        name: data.name,
        venueTypes: data.venueTypes.length ? data.venueTypes : [data.venueType],
        permalink: data.permalink,
        photos: (data.album && data.album.photos) ? data.album.photos : [],
        address: {
          full: data.address.full,
          line1: data.address.line1,
          city: data.address.city,
          lang: data.address.lang,
          distance: '100m',
          coordinates: data.address.coordinates
        },
        owned: data.owned,
        open: 'Open today from 10 to 16',
        description: data.description,
        openingHours: data.openingHours, //'Tue–Fri 10 – 16, Sat–San 10 – 18,  Mondays closed.',
        openByAppointment: !!data.openByAppointment,

        links: data.links,

        contacts: data.contacts,
        admissionFee: data.admissionFee,
        websites: data.websites,

        // Exhibitions
        exhibitions: data.exhibitions,

        guestbook: []
      };

      // Edit venue types
      var major = ['gallery', 'museum', 'public', 'other'];
      // Loop through types
      for (var i = $scope.venue.venueTypes.length - 1; i >= 0; i--) {
        // Remove if major
        if (major.indexOf($scope.venue.venueTypes[i]) >= 0) {
          $scope.venue.venueTypes.splice(i, 1);
        }
      }
    }).catch(function() {
      // Error
      $state.go('404');
    });
  };

  // Load venue
  $scope.loadVenue();
}
