'use strict';

angular.module('main').controller('EditVenueController', [
  '$rootScope', '$scope', '$resource', '$state', '$window', 'Upload', 'API', 'MapOptions', 'uiGmapGoogleMapApi', '$timeout', 'moment', '$element',
  function($rootScope, $scope, $resource, $state, $window, Upload, API, MapOptions, uiGmapGoogleMapApi, $timeout, moment, $element) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.today = moment();
    $scope.admin = $window.admin;

    $scope.files = [];
    $scope.photos = [];

    $scope.blurs = [];
    $scope.blur = function(name) {
      if (!$scope.blurred(name)) {
        // Add to blurs
        $scope.blurs.push(name);
      }
    };
    $scope.blurred = function(name) {
      return $scope.blurs.indexOf(name) >= 0;
    };

    // Address error
    $scope.addressError = '';

    angular.element('tags-input').each(function() {
      // Input
      var input = angular.element(this), name = input.attr('name');
      // On blur
      input.on('blur', 'input:text', function() {
        // Set blur
        $scope.blur(name);
      });
    });

    $scope.redirect = null;

    var defaultOpeningHours = [
      {
        day: 0, hours: [{ start: '', end: '' }]
      },
      {
        day: 1, hours: [{ start: '1100', end: '1700' }]
      },
      {
        day: 2, hours: [{ start: '1100', end: '1700' }]
      },
      {
        day: 3, hours: [{ start: '1100', end: '1700' }]
      },
      {
        day: 4, hours: [{ start: '1100', end: '1700' }]
      },
      {
        day: 5, hours: [{ start: '1200', end: '1600' }]
      },
      {
        day: 6, hours: [{ start: '1200', end: '1600' }]
      }
    ];

    // Set map
    $scope.map = {
      maps: null,
      geocoder: null,
      gmap: null,
      marker: null,
      options: MapOptions,
      zoom: 15,
      geocodeDelay: null,
      geocoding: false,
      geocode: function() {
        var _this = this;
        // If geocoding
        if (this.geocoding) {
          return false;
        }
        // Cancel timer
        if (this.geocodeDelay) {
          $timeout.cancel(this.geocodeDelay);
        }
        // Set timer
        $timeout(function() {
          // Do geocode
          $scope.map.geocoder.geocode({ address: $scope.map.fullAddress() }, function(results, status) {
            if (status === $scope.map.maps.GeocoderStatus.OK && results[0]) {
              // Set center
              $scope.map.gmap.setCenter(results[0].geometry.location);
            }
            $scope.map.geocoding = false;
          });
        }, 1000);
      },
      init: function(maps, map) {
        // Set gmap
        $scope.map.maps = maps;
        $scope.map.gmap = map;
        // Create marker
        $scope.map.marker = new maps.Marker({
          position: map.getCenter(),
          map: map,
          icon: $window.location.origin + root + '/images/marker.png'
        });

        // Create geocoder
        $scope.map.geocoder = new maps.Geocoder();

        // Watch
        $scope.$watch('form.input.address.line1', function(newValue, oldValue) {
          if (newValue !== oldValue) {
            // Do geocode
            $scope.map.geocode();
          }
        });

        var busySearching = false,
            cityTimeout = null;

        $scope.$watch('form.input.address.city', function(newValue, oldValue) {
          if (newValue !== oldValue && !busySearching) {
            // If there's any
            if (cityTimeout) {
              // Cancel
              $timeout.cancel(cityTimeout);
            }
            // Set it
            cityTimeout = $timeout(function() {
              // Busy
              busySearching = true;
              // Validate city
              API.get('location/city', { name: newValue }).then(function(response) {
                // Reset
                busySearching = false;
                // Empty
                $scope.addressError = '';
                // If there's error
                if (response.data && !response.data.success && response.data.error) {
                  // Set it
                  $scope.addressError = response.data.error || '';
                } else {
                  // Set city name and country
                  $scope.form.input.address.city = response.data.name;
                  $scope.form.input.address.country = [response.data.country];
                  // Set lang
                  $scope.form.input.address.lang = response.data.lang;
                  // Do geocode
                  $scope.map.geocode();
                }
              });
            }, 1000);
          }
        });
      },
      change: function(map) {
        // Get center
        var center = map.getCenter();
        // Change position
        $scope.map.marker.setPosition(center);
      },
      fullAddress: function() {
        var address = $scope.form.input.address.line1 +
                      ($scope.form.input.address.line1 ? ', ' : '') +
                      $scope.form.input.address.city;
        // If there's no address
        if (!address) {
          address = 'Helsinki';
        }
        // Add Finland and return
        return address + ', Finland';
      }
    };

    var defaultSpecialHours = [
      {
        date: '',
        startHour: '',
        endHour: ''
      }
    ];

    var getPhotoIndexById = function(id) {
      for (var i in $scope.photos) {
        if ($scope.photos[i].id === id) {
          // Return
          return i;
        }
      }
      return -1;
    };

    var elem = angular.element;

    $scope.removePhoto = function(id) {
      // Get
      var index = getPhotoIndexById(id);

      if (index >= 0) {
        elem('#photo-' + id).fadeTo(200, 0.01, function() {
          // Remove
          $scope.photos.splice(index, 1);
          elem('.uploaded .photo').css('opacity', 1);
          if (!$scope.$$phase) {
            $scope.$apply();
          }
        });
      }
    };

    // Compile photos
    var compilePhotos = function() {
      var photos = [];
      for (var i in $scope.photos) {
        photos.push($scope.photos[i].source);
      }
      return photos;
    };

    var uploadCounter = 0;

    $scope.upload = function(files) {
      // Loop
      for (var i in files) {
        var file = files[i];

        uploadCounter++;
        // Set id
        file.uploadId = uploadCounter;

        // Append to photos
        $scope.photos.push({
          id: uploadCounter,
          loading: true,
          full: '',
          source: ''
        });

        /* jshint ignore:start */
        // Do upload
        Upload.upload({
          url: '/api/upload',
          fields: { },
          file: file
        }).progress(function(evt) {

        }).success(function(data, status, headers, config) {
          // Get photo
          var index = getPhotoIndexById(config.file.uploadId);
          // If there's any
          if (index >= 0) {
            // Set source
            $scope.photos[index].source = data.file.full;
            elem('#photo-' + config.file.uploadId).removeClass('loading');
          }
        });
        /* jshint ignore:end */
      }
    };

    $scope.confirmDelete = false;
    // Delete
    $scope.delete = function() {
      // Delete
      API.delete('venues/' + $state.params.permalink).then(function(response) {
        // Redirect
        $state.go('profile');
      });
    };

    $scope.activeEvents = [];

    // Load
    $scope.loadVenue = function(done) {
      // Load
      API.get('venues/' + $state.params.permalink)
        .then(function(response) {
          // If not owner
          if (!response.data.owned) {

            $state.go('profile');

            // Exit
            return false;
          }
          // Set to input
          $scope.form.input = response.data;
          $scope.venue = angular.copy(response.data);

          // Put in array
          $scope.form.input.owner = [response.data.owner];

          // Put address
          $scope.form.input.address.country = [response.data.address.country];
          // Push if there's any

          if (response.data.exhibitions && response.data.exhibitions.length) {
            // Loop
            for (var i in response.data.exhibitions) {
              // If active
              if (response.data.exhibitions[i].active) {
                // Add to active
                $scope.activeEvents.push(response.data.exhibitions[i]);
              }
            }
          }

          // If there's no openingHours
          if (!$scope.form.input.openingHours || $scope.form.input.openingHours.length === 0) {
            // Clone default
            $scope.form.input.openingHours = defaultOpeningHours.slice(0);
            // console.log($scope.form.input.openingHours);
          }
          // If there's no specialHours
          if (!$scope.form.input.specialHours || $scope.form.input.specialHours.length === 0) {
            // Clone default
            $scope.form.input.specialHours = defaultSpecialHours.slice(0);
            // console.log($scope.form.input.openingHours);
          }

          // If there's no links
          if (!$scope.form.input.links || !$scope.form.input.links.length) {
            // Set default
            $scope.form.input.links = [{
              title: '',
              url: ''
            }];
          }

          // Set photos
          $scope.photos = (response.data.album && response.data.album.photos) ? response.data.album.photos : [];

          if (done) {
            done(response.data);
          }

          // Wait a while
          $timeout(function() {
            $scope.toggleDates(!!$scope.form.input.openByAppointment);
          }, 200);
        });
    };

    $scope.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Hours
    $scope.hours = [''];

    for (var h = 0; h <= 23; h++) {
      // Add to hours
      var hour = h ? (((h < 10) ? '0' : '') + h) : '00';
      // Push
      $scope.hours.push(hour + '00');
      // Push with 30
      $scope.hours.push(hour + '30');
    }

    $scope.hours.push('2359');

    $scope.addHoursRange = function(dayIndex) {
      // Get last
      var last = $scope.form.input.openingHours[dayIndex].hours[$scope.form.input.openingHours[dayIndex].hours.length - 1];
      $scope.form.input.openingHours[dayIndex].hours.push({
        start: last.end,
        end: last.end
      });
    };
    $scope.removeHoursRange = function(dayIndex, rangeIndex) {
      // Last
      var lastRange = ($scope.form.input.openingHours[dayIndex].hours.length <= 1);
      $scope.form.input.openingHours[dayIndex].hours.splice(rangeIndex, 1);
      // If last
      if (lastRange) {
        $scope.form.input.openingHours[dayIndex].hours.push({
          start: '',
          end: ''
        });
      }
    };

    $scope.closeSpecial = function() {
      $scope.form.input.specialHours = [{
        date: '',
        startHour: '',
        endHour: ''
      }];
    };
    $scope.isClosedSpecial = function() {
      // Return
      return ($scope.form.input.specialHours.length === 1) &&
              !$scope.form.input.specialHours[0].date &&
              !$scope.form.input.specialHours[0].start &&
              !$scope.form.input.specialHours[0].end;
    };

    $scope.closeOn = function(dayIndex) {
      // Close
      $scope.form.input.openingHours[dayIndex].hours = [{
        start: '',
        end: ''
      }];
    };
    $scope.isClosedOn = function(dayIndex) {
      // Return
      var day = $scope.form.input.openingHours[dayIndex];
      return (day.hours.length === 1) &&
              !day.hours[0].start &&
              !day.hours[0].end;
    };

    $scope.openWholeDayOn = function(dayIndex) {
      // Close
      $scope.form.input.openingHours[dayIndex].hours = [{
        start: '0000',
        end: '2359'
      }];
    };
    $scope.isOpenWholeDayOn = function(dayIndex) {
      // Return
      var day = $scope.form.input.openingHours[dayIndex];
      return (day.hours.length === 1) &&
              day.hours[0].start === '0000' &&
              day.hours[0].end === '2359';
    };

    $scope.toggleAppointment = function() {
      $scope.form.input.openByAppointment = !$scope.form.input.openByAppointment;
      $scope.toggleDates($scope.form.input.openByAppointment);
    };

    $scope.toggleDates = function(single) {
      // If true or false
      if (single) {
        angular.element('.day.group.regular, .day.group.special')
          .each(function() {
            angular.element(this)
              .find('input, select, textarea')
              .each(function() {
                angular.element(this)
                  .attr('disabled', 'disabled')
                  .addClass('disabled');
              });
          });
      } else {
        angular.element('.day.group.regular, .day.group.special')
          .each(function() {
            angular.element(this)
              .find('input, select, textarea')
              .each(function() {
                angular.element(this)
                  .removeAttr('disabled')
                  .removeClass('disabled');
              });
          });
      }
    };

    $scope.addSpecial = function() {
      $scope.form.input.specialHours.push({
        date: '',
        startHour: '',
        endHour: ''
      });
    };
    $scope.removeSpecial = function(index) {
      $scope.form.input.specialHours.splice(index, 1);
    };

    $scope.$watchCollection('form.input.venueTypes', function(current, prev) {
      // Look for major
      for (var i in $scope.form.types) {
        // Major
        var major = $scope.form.types[i];
        // If no longer exists
        if (current.indexOf(major.name) < 0 && prev.indexOf(major.name) >= 0) {
          // Remove all with this major
          for (var j = $scope.form.input.venueTypes.length - 1; j >= 0; j--) {
            // Get type
            var venueType = $scope.form.input.venueTypes[j];
            // Check if same
            if (venueType.substr(0, major.name.length) === major.name) {
              // Remove
              $scope.form.input.venueTypes.splice(j, 1);
            }
          }
        }
      }
    });

    $scope.isMajorVenueType = function(venueType) {
      // Loop through types
      for (var i in $scope.form.types) {
        // If in
        if (venueType === $scope.form.types[i].name) {
          // Return
          return $scope.form.types[i];
        }
      }
      return false;
    };

    $scope.requiredVenueTypes = function() {
      // Errors
      var errors = [];
      // Loop through
      for (var i in $scope.form.input.venueTypes) {
        // Get venue type
        var venueType = $scope.form.input.venueTypes[i];

        // Major type
        var majorType = $scope.isMajorVenueType(venueType);

        // If major
        if (majorType) {
          // Has one
          var hasOneSubtype = false;
          // Loop all
          for (var j in $scope.form.input.venueTypes) {
            // This type
            var thisType = $scope.form.input.venueTypes[j];
            // If not the type above but is a sub type
            if (thisType !== venueType && thisType.substr(0, venueType.length) === venueType) {
              // Has subtype
              hasOneSubtype = true;
              break;
            }
          }
          // If there's no subtype
          if (!hasOneSubtype) {
            // Add to errors
            errors.push('Please choose at least one venue type under ' + majorType.title);
          }
        }
      }
      // Return
      return errors;
    };

    $scope.form = {
      // Types
      types: [
        {
          name: 'gallery',
          title: 'gallery',
          sub: [
            {
              name: 'gallery artist run',
              title: 'artist run'
            },
            {
              name: 'gallery contemporary',
              title: 'contemporary'
            },
            {
              name: 'gallery commercial',
              title: 'commercial'
            },
            {
              name: 'gallery international',
              title: 'international'
            },
            {
              name: 'gallery lifestyle',
              title: 'lifestyle'
            },
            {
              name: 'gallery modern',
              title: 'modern'
            },
            {
              name: 'gallery other',
              title: 'other'
            }
          ]
        },
        {
          name: 'museum',
          title: 'art museum',
          sub: [
            {
              name: 'museum contemporary',
              title: 'contemporary'
            },
            {
              name: 'museum historical',
              title: 'historical'
            },
            {
              name: 'museum modern',
              title: 'modern'
            },
            {
              name: 'museum specific genre',
              title: 'specific genre (photography, design, etc.)'
            },
            {
              name: 'museum other',
              title: 'other'
            }
          ]
        },
        {
          name: 'public',
          title: 'public space',
          sub: [
            {
              name: 'public street',
              title: 'street'
            },
            {
              name: 'public building',
              title: 'public building'
            },
            {
              name: 'public park',
              title: 'park'
            },
            {
              name: 'public forest',
              title: 'forest'
            },
            {
              name: 'public other',
              title: 'other'
            }
          ]
        },
        {
          name: 'other',
          title: 'other',
          sub: [
            {
              name: 'other artist studio',
              title: 'artist studio'
            },
            {
              name: 'other curator studio',
              title: 'curator studio'
            },
            {
              name: 'other private house',
              title: 'private house'
            }
          ]
        }
      ],
      // Type active
      typeActive: function(type) {
        // Return
        return type === $scope.form.input.venueType;
      },
      // Type active
      typeIsActive: function(type) {
        // Return
        return $scope.form.input.venueTypes.indexOf(type) >= 0;
      },
      // Admission fees
      admissionFees: [
        {
          name: 'free',
          title: 'free'
        },
        {
          name: '1-6',
          title: '1 € – 6 €'
        },
        {
          name: '6-12',
          title: '6 € – 12 €'
        },
        {
          name: '12-18',
          title: '12 € – 18 €'
        },
        {
          name: '19+',
          title: '19 € –> €'
        }
      ],
      // Admission fee active
      admissionFeeActive: function(admissionFee) {
        // Return
        return admissionFee === $scope.form.input.admissionFee;
      },
      input: {
        owner: [],
        venueType: 'gallery',
        venueTypes: ['gallery'],
        admissionFee: 'free',
        openingHours: [],
        specialHours: []
      },
      response: {

      },

      /**
       * Load
       */
      loadEntries: function(endppoint, query) {
        // Get artists with query
        return API.get(endppoint, {
          q: query,
          return: 'data'
        });
      },

      /**
       * Load users
       */
      loadUsers: function(query) {
        // Get artists with query
        return $scope.form.loadEntries('users/find', query);
      },

      /**
       * Load countries
       */
      loadCountries: function(query) {
        // Get countries with query
        return $scope.form.loadEntries('location/countries', query);
      },

      submit: function() {
        // Set this
        var _this = this;
        // Set photos
        _this.input.photos = compilePhotos();
        // Empty message
        this.response.message = '';

        var reqErrors = $scope.requiredVenueTypes();

        if (reqErrors.length) {
          // Error
          this.response.message = reqErrors[0];
        } else {
          // Put (since we're updating)
          API.put('venues/' + $state.params.permalink, _this.input).then(function(response) {
            // Set response
            _this.response = response.data;
            // If success
            if (_this.response.success) {
              // Set message
              _this.response.message = 'Venue successfully updated';
              // Redirect
              $scope.redirect = ['venue', { permalink: response.data.data.permalink }];
              // Update translations
              $rootScope.$broadcast('updateCities');
            }
          });
        }

      }
    };

    // Add link
    $scope.addLink = function() {
      $scope.form.input.links.push({
        title: '',
        url: ''
      });
    };
    // Remove link
    $scope.removeLink = function($index) {
      $scope.form.input.links.splice($index, 1);
    };

    $scope.setDefaultUrl = function() {
      if (!$scope.form.input.website) {
        $scope.form.input.website = 'http://';
      }
    };
    $scope.removeDefaultUrl = function() {
      if ($scope.form.input.website === 'http://') {
        $scope.form.input.website = '';
      }
    };
    // Validate email
    $scope.validateEmail = function() {
      return /.+\@.+\..+/.test($scope.form.input.email);
    };

    // Validate city
    $scope.isValidCity = function() {
    	return !(/\d/.test($scope.form.input.address.city));
    };

    $element.on('keydown', 'input.date', function() {
      return false;
    });

    $scope.specialDateIndex = -1;
    $scope.specialDateFocused = function($index) {
      // Set
      $scope.specialDateIndex = $index;
    };

    // Hide datepicker
    $scope.hideDatepicker = function() {
      $scope.specialDateIndex = -1;
    };
    $scope.loadVenue();
  }
]);
