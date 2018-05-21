'use strict';

angular.module('main').controller('ArtCacheController', ArtCacheController);

ArtCacheController.$inject = [
	'$window',
	'$scope',
	'API',
	'$state',
	'MapOptions',
	'uiGmapGoogleMapApi',
	'MapResponsive',
	'$timeout',
	'Authentication'
];

function ArtCacheController($window, $scope, API, $state, MapOptions, uiGmapGoogleMapApi, MapResponsive, $timeout, Authentication) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.admin = !!$window.admin;

  // Set exhibition
  $scope.exhibition = {};
  // Set comment source
  $scope.commentSource = '';

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
    //API.get('artcache'/* + $state.params.permalink*/).then(function(response) {

      // Set data
      var data = $window.artCache[0];// response.data; //[0];

      Authentication.promise.then(function() {

        if (Authentication.user && Authentication.user.hiddenArtCache) {
          // Loop
          for (var i in Authentication.user.hiddenArtCache) {
            // Hidden
            var hidden = Authentication.user.hiddenArtCache[i];

            if (data._id === (hidden._id || hidden)) {
              // Redirect
              $state.go('landing-now');
              // Quit
              break;
            }
          }
        }

      });

      if (!data.venue) {
      	return;
      }

      // Set center
      $scope.map.center.latitude = data.venue.address.coordinates.latitude;
      $scope.map.center.longitude = data.venue.address.coordinates.longitude;

      MapResponsive.setCenter('desktop', data.venue.address.coordinates);
      MapResponsive.setCenter('mobile', data.venue.address.coordinates);

      // Change comment source
      $scope.commentSource = 'artcache/' + data._id + '/comments';

      // Set label
      $scope.map.marker.options.title = data.venue.name;
      $scope.map.marker.options.labelContent = data.venue.name;
      // Set venue
      $scope.exhibition = {
        photos: data.gallery.photos,

        date: {
          start: data.startDate,
          end: data.endDate
        },

        name: data.name,
        permalink: data.permalink,
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

        genre: data.genres, //['Photography', 'digital art'],

        venue: {
          name: data.venue.name,
          permalink: data.venue.permalink,
          address: {
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
    //});
  };

  $scope.loadExhibition();

}
