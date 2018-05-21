'use strict';

angular.module('main').controller('ExhibitionController', ExhibitionController);

ExhibitionController.$inject = [
	'$rootScope',
	'$window',
	'$scope',
	'API',
	'$state',
	'MapOptions',
	'MapResponsive',
	'$timeout',
	'location',
  'moment',
  '$interval',
];

function ExhibitionController($rootScope, $window, $scope, API, $state, MapOptions, MapResponsive, $timeout, location, moment, $interval) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  // Set exhibition
  $scope.exhibition = {};
  // Set comment source
  $scope.commentSource = '';

  // Set location
  $scope.location = location;

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
      var endpoint = 'events/' + $state.params.permalink + '/recommend';
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
      var endpoint = 'events/' + $state.params.permalink + '/favorite';
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
      $state.go('map', { event: $scope.exhibition.permalink });
    }
  };

  // Create touch
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
    desktopControl: {},
    mobileControl: {}
  };

  MapResponsive
    .setCenter('desktop', $scope.map.center)
    .setCenter('mobile', $scope.map.center)
    .initialize('desktop', $scope.map.desktopControl)
    .initialize('mobile', $scope.map.mobileControl);

  // Load
  $scope.loadExhibition = function(done) {
    // Get
    API.get('events/' + $state.params.permalink).then(function(response) {
      // Set data
      var data = response.data;

      // If there's no id
      if (!data._id || !data.id) {
        // Redirect
        $state.go('404');
        return false;
      }

      // Set center
      $scope.map.center.latitude = data.venue.address.coordinates.latitude;
      $scope.map.center.longitude = data.venue.address.coordinates.longitude;

      MapResponsive.setCenter('desktop', data.venue.address.coordinates);
      MapResponsive.setCenter('mobile', data.venue.address.coordinates);

      // Change comment source
      $scope.commentSource = 'events/' + data.permalink + '/comments';

      // Set favorite
      $scope.menu.favorited = data.favorite;
      // Set recommended
      $scope.menu.recommended = data.recommend;

      // Set label
      $scope.map.marker.options.title = data.venue.name;
      $scope.map.marker.options.labelContent = data.venue.name;
      // Set venue
      $scope.exhibition = {
        permalink: data.permalink,
        photos: data.gallery.photos,

        date: {
          start: data.startDate,
          end: data.endDate
        },
        owned: data.owned,

        name: data.name,
        secondaryName: data.secondaryName,
        artists: data.artists,

        open: 'Open today from 10 to 16',
        openingHours: data.openingHours, //'10 – 16, 10 – 18, mondays closed.',
        specialHours: data.specialHours,
        openByAppointment: !!data.openByAppointment,
        admissionFee: data.admissionFee,
        description: data.description,

        publications: [
          {
            publisher: 'Helsingin Sanomat',
            authors: ['Timo Valjakka'],
            date: '2014-05-20'
          },
          {
            publisher: 'Edit Media',
            authors: ['Pekka Putkonen'],
            date: '2015-05-25'
          }
        ],
        links: data.links,

        genre: data.genres, // ['Photography', 'digital art'],

        venue: {
          name: data.venue.name,
          permalink: data.venue.permalink,
          address: {
            line1: data.venue.address.line1,
            city: data.venue.address.city,
            lang: data.venue.address.lang,
            full: data.venue.address.full,
            distance: '100m',
            coordinates: data.venue.address.coordinates
          }
        },

        comments: [
          {
            date: '2015-01-08',
            content: 'On Saturday 17th John Philip will give an introduction to the exhibition and tell about the creating process. Be there!',
            author: {
              name: 'Mari M.',
              website: ''
            }
          },
          {
            date: '2015-01-06',
            content: 'Once again a great exhibition at Forum Box! Highly recommended!',
            author: {
              name: 'Mika P.',
              website: ''
            }
          },
          {
            date: '2015-01-05',
            content: 'Thanks John Philip and Mari!',
            author: {
              name: 'Paula K.',
              website: ''
            }
          }
        ]
      };
    }).catch(function() {
      // Error
      $state.go('404');
    });
  };

  $scope.loadExhibition();

  // $scope.time = moment();

  // $interval(function() {
  //   $scope.time = moment();
  // });


}
