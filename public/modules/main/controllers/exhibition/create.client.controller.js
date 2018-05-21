'use strict';

angular.module('main').controller('CreateExhibitionController', CreateExhibitionController);

CreateExhibitionController.$inject = [
	'$scope',
	'$element',
	'$rootScope',
	'$resource',
	'$state',
	'$stateParams',
	'$window',
	'Upload',
	'API',
	'moment',
	'$templateCache',
	'$timeout',
	'genres',
  '$q',
];

function CreateExhibitionController($scope, $element, $rootScope, $resource, $state, $stateParams, $window, Upload, API, moment, $templateCache, $timeout, genres, $q) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.today = moment();
    $scope.admin = $window.admin;

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

    $scope.redirect = null;

    angular.element('tags-input').each(function() {
      // Input
      var input = angular.element(this),
      		name = input.attr('name');

      // On blur
      input.on('blur', 'input:text', function() {
        // Set blur
        $scope.blur(name);
      });
    });

    angular.element('div.uploaded:first').on('blur', '.photo tags-input input:text', function() {
      // Name
      var input = angular.element(this),
          index = parseInt(input.parents('.photo:first').attr('index'));
      // Blur photo
      $scope.photos[index].blurred = true;
    });

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

    $scope.artCache = {
      enabled: false,
      choices: [
        { active: true, title: 'enabled' },
        { active: false, title: 'disabled' }
      ],
      active: function(choice) {
        return (choice.active.toString() === $scope.artCache.enabled.toString());
      },
      titles: {}
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

    $scope.files = [];
    $scope.photos = [];

    var uploadCounter = $scope.photos.length;

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
            $scope.photos[index].blurred = false;
            elem('#photo-' + config.file.uploadId).removeClass('loading');
          }
        });
        /* jshint ignore:end */
      }
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

      if ($scope.singleDay()) {
        return false;
      }
      // Get last
      var last = $scope.form.input.openingHours[dayIndex].hours[$scope.form.input.openingHours[dayIndex].hours.length - 1];
      $scope.form.input.openingHours[dayIndex].hours.push({
        start: last.end,
        end: last.end
      });
    };
    $scope.removeHoursRange = function(dayIndex, rangeIndex) {

      if ($scope.singleDay()) {
        return false;
      }
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

    $scope.addSpecial = function() {
      $scope.form.input.specialHours.push({
        date: '',
        startHour: '',
        endHour: ''
      });
    };
    $scope.removeSpecial = function(index) {
      // Reset
      var lastSpecial = ($scope.form.input.specialHours.length <= 1);
      $scope.form.input.specialHours.splice(index, 1);
      // If last
      if (lastSpecial) {
        $scope.addSpecial();
      }
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

    $scope.hasOneSpecialDate = function() {
      // Loop through special
      for (var i in $scope.form.input.specialHours) {
        // If there's any
        if ($scope.form.input.specialHours[i] &&
            $scope.form.input.specialHours[i].date &&
            $scope.form.input.specialHours[i].startHour &&
            $scope.form.input.specialHours[i].endHour) {
          // Return
        return true;
        }
      }
      // False
      return false;
    };
    // Has special
    $scope.hasSpecial = function() {
      // Return
      return $scope.hasOneSpecialDate();
    };
    // Watch special date
    $scope.$watch('hasSpecial()', function(current, prev) {

      if (current !== prev) {
        // Toggle
        $scope.toggleDates(current);
      }
    });

    $scope.artists = {
      list: [],
      loaded: false,
      deferred: $q.defer(),
      load: function() {
        // If loaded
        if ($scope.artists.loaded) {
          // Return the promise
          return $scope.artists.deferred.promise;
        }
        // Do load
        API.get('artists/list').then(function(response) {
          // Set to list
          $scope.artists.list = response.data.data || [];
          // Loaded
          $scope.artists.loaded = true;
          // Resolve
          $scope.artists.deferred.resolve($scope.artists);
        });
        // Return the promise
        return $scope.artists.deferred.promise;
      },
      query: function(query) {
        // Create promise
        var deferred = $q.defer();
        // To lower case
        query = query.toLowerCase();
        // Make sure to load
        $scope.artists.load().then(function(artists) {
          // Found
          var found = [];
          // Loop through artists
          artists.list.forEach(function(artist) {
            // If name matches
            if (artist.name.full.toLowerCase().indexOf(query) >= 0) {
              // Add to found
              found.push(artist);
            }
          });
          // Resolve found
          deferred.resolve(found);
        });
        // Return the promise
        return deferred.promise;
      }
    };
    // Load
    $scope.artists.load();

    $scope.form = {
      genreActive: function(genre) {
        return this.input.genres.indexOf(genre) >= 0;
      },
      genres: genres,
      /**
       * Load artists
       */
      loadArtists: function(query) {
        // Get artists with query
        return API.get('artists', {
          q: query,
          'return': 'data'
        });
      },
      /**
       * Tag counter
       */
      tagCounter: 0,
      /**
       * Tag added
       */
      tagAdded: function(tag) {
        // Increment
        $scope.form.tagCounter++;
        // Set id if there's none
        if (!tag._id) {
          tag._id = $scope.form.tagCounter;
          tag.guest = true;
        }
      },
      /**
       * Load venues
       */
      loadVenues: function(query) {
        // Get artists with query
        return API.get('venues', {
          q: query,
          'return': 'data'
        });
      },
      dates: {
        start: $scope.today.clone().toDate(),//format('YYYY-MM-DD'),
        end: $scope.today.clone().add(5, 'days').toDate()//.format('YYYY-MM-DD')
      },
      input: {
        genres: [],
        artists: [],
        venue: [],
        openingHours: defaultOpeningHours.slice(0),
        specialHours: defaultSpecialHours.slice(0),
        links: [{
          title: '',
          url: ''
        }]
      },
      response: {

      },
      submit: function() {
        // Set this
        var _this = this;

        if (_.size($scope.photos) > 0) {
        	var hasEmptyPhotoArtists = false;

        	angular.forEach($scope.photos, function(photo) {
        		if (_.size(photo.nonUserArtists) === 0) {
        			hasEmptyPhotoArtists = true;
        		}
	        });

	        if (hasEmptyPhotoArtists === true) {
	        	this.response.message = 'Please select the artist/s for the photos';
	        	return false;
	        }
        }

        // Set photos
        _this.input.photos = $scope.photos;
        // Empty message
        this.response.message = '';
        // Post
        API.post('events', _this.input).then(function(response) {
          // Set response
          _this.response = response.data;

          if (response.data.success) {
            // Redirect
            $scope.redirect = ['exhibition', { permalink: response.data.data.permalink }];
          }
        });
      }
    };

    // If there's venue
    if ($stateParams.venue) {
      // Load
      API.get('venues/' + $stateParams.venue).then(function(response) {
        // Set venue
        $scope.form.input.venue = [response.data];
        // $scope.form.input.admissionFee = response.data.admissionFee;
        $scope.prefillEvent();
      });
    }

    // Get first tags-input
    var venueName = $element.find('tags-input:first');

    $scope.$watch(function() {
      return venueName.attr('class');
    }, function(current, prev) {
      if (venueName.hasClass('ng-invalid')) {
        // Call popup
        $rootScope.$broadcast('openPopup', 'venueDoesNotExist');
      }
    });

    $scope.focusVenue = function() {
      $element.find('tags-input:first input:last').focus().select();
    };

    // Get datepicker
    var datePicker = $element.find('.input.dates [date-range]:first');

    /**
     * This is the hack to hijack the datepickers
     * setDate is the event that the datepicker emits (so glad it does this, or else this won't be possible)
     */
    $scope.$on('setDate', function(e, args) {
      // Check if the scope the event is being called from is under a dateRange
      if (typeof e.targetScope.$parent.start === 'object' &&
          typeof e.targetScope.$parent.end === 'object' &&
          e.targetScope.date &&
          (e.targetScope.$$prevSibling || e.targetScope.$$nextSibling)) {
        // Identify whether the start or end, we are only going to change the start
        if (!e.targetScope.$$prevSibling && e.targetScope.$$nextSibling) {
          // Check months
          var startDate = e.targetScope.date,
              endDate = e.targetScope.$$nextSibling.date,
              startMonth = startDate.getMonth(),
              endMonth = endDate.getMonth();
          // If months do not match
          if (startMonth !== endMonth) {
            // Resolve month
            // This will change the end date's month view
            // Which will update the second datepicker in the daterange

            endDate.setYear(startDate.getFullYear());
            endDate.setMonth(startMonth);
          }
        }
      }
    });

    /**
     * Overwrite date-range template
     */
    $templateCache.put('templates/daterange.html',
      '<div class="date-range-wrap">' +
        '<div class="date-picker-wrap"><h4>{{ \'Opening\' | lang }}</h4><div date-picker="start" ng-disabled="disableDatePickers" class="date-picker start" date after="start" before="end" min-view="date" max-view="date"></div></div>' +
        '<div class="date-picker-wrap"><h4>{{ \'Closing\' | lang }}</h4><div date-picker="end" ng-disabled="disableDatePickers" class="date-picker end" date after="start" before="end" min-view="date" max-view="date"></div></div>' +
      '</div>'
    );

    // Show datepicker
    $scope.showDatepicker = function() {
      datePicker.fadeIn(200);
    };
    // Hide datepicker
    $scope.hideDatepicker = function() {
      datePicker.fadeOut(200);
      $scope.specialDateIndex = -1;
    };

    // Watch dates
    $scope.$watchCollection('[form.dates.start, form.dates.end]', function(current, prev) {
      // Set start
      var start = moment($scope.form.dates.start),
          end = moment($scope.form.dates.end);
      // Format input
      $scope.form.input.dates = start.format('DD.MM.YYYY') + '-' + end.format('DD.MM.YYYY');
    });

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

    // Prefill event
    $scope.prefillEvent = function() {
      $scope.form.input.admissionFee = $scope.form.input.venue[0].admissionFee;
      $scope.form.input.openingHours = angular.copy($scope.form.input.venue[0].openingHours);
    };

    $element.on('keydown', 'input.date, .input.dates:first input[name="dates"]', function() {
      return false;
    });

    $scope.specialDateIndex = -1;
    $scope.specialDateFocused = function($index) {
      // Set
      $scope.specialDateIndex = $index;
    };

    $scope.singleDay = function() {
      // If start and end matches
      return $scope.form.dates.start.toString() === $scope.form.dates.end.toString();
    };
    $scope.$watch('singleDay()', function(current, prev) {

      if (current !== prev) {
        // Toggle
        $scope.toggleDates(current);
      }
    });

  }
