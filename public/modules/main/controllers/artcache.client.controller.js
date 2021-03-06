'use strict';

angular.module('main').controller('EditArtCacheController', ['$scope', '$resource', '$state', '$window', 'Upload', 'API', 'moment', '$element', '$rootScope', '$templateCache', '$timeout', 'genres',
  function($scope, $resource, $state, $window, Upload, API, moment, $element, $rootScope, $templateCache, $timeout, genres) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.today = moment();
    $scope.admin = $window.admin;

    if (!$scope.admin) {
      // Redirect
      $state.go('exhibition-create');
      return false;
    }

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
            elem('#photo-' + config.file.uploadId).removeClass('loading');
          }
        });
        /* jshint ignore:end */
      }
    };

    // Load
    $scope.loadExhibition = function(done) {
      // Load
      API.get('artcache')
        .then(function(response) {

          var data = response.data.data[0];
          // Set to input
          $scope.form.input = data;

          if (data.venue && data.venue._id) {
            // Set venue in array
            $scope.form.input.venue = [data.venue];
          } else {
            $scope.form.input.venue = [];
          }

          // Set photos
          $scope.photos = [];
          // Loop through photos
          if (data.gallery && data.gallery.photos) {
            for (var i in data.gallery.photos) {
              // Set photo
              var photo = data.gallery.photos[i];
              // Set photos
              $scope.photos.push({
                id: photo.photo._id,
                _id: photo.photo._id,
                title: photo.photo.title,
                caption: photo.caption,
                source: photo.photo.source,
                artists: [], // photo.artists,
                nonUserArtists: photo.nonUserArtists
              });
            }
          }

          // Edit artists
          var artists = [];
          for (var n in data.artists) {
            var artist = data.artists[n];

            if (artist.user && artist.user._id) {
              artists.push(artist.user);
            } else {
              // Count
              $scope.form.tagCounter++;
              // Push non user
              artists.push({
                _id: $scope.form.tagCounter,
                fullname: artist.nonUser.fullname,
                guest: true
              });
            }
          }
          // Set artists
          $scope.form.input.artists = artists;

          var dateStart = moment(data.startDate),
              dateEnd = moment(data.endDate);

          // Set dates
          $scope.form.dates.start = dateStart.toDate();//format('YYYY-MM-DD');
          $scope.form.dates.end = dateEnd.toDate();//format('YYYY-MM-DD');
          // $scope.form.input.dates = dateStart.clone().format('DD.MM.YYYY') + '-' + dateEnd.clone().format('DD.MM.YYYY');

          // If there's no openingHours
          if (!$scope.form.input.openingHours || $scope.form.input.openingHours.length === 0) {
            // Clone default
            $scope.form.input.openingHours = defaultOpeningHours.slice(0);
            // console.log($scope.form.input.openingHours);
          }
          $scope.loadedOpeningHours = angular.copy($scope.form.input.openingHours);

          // If there's no specialHours
          if (!$scope.form.input.specialHours || $scope.form.input.specialHours.length === 0) {
            // Clone default
            $scope.form.input.specialHours = defaultSpecialHours.slice(0);
            // console.log($scope.form.input.openingHours);
          }

          // If there's no links
          if (!$scope.form.input.links || !$scope.form.input.links.length) {
            // Set links
            $scope.form.input.links = [{
              title: '',
              url: ''
            }];
          }

          if (done) {
            done(data);
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

    $scope.addHoursRange = function(dayIndex) {

      if ($scope.singleDay()) {
        return false;
      }
      // If disabled
      if ($scope.disableDates) {
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
      // If disabled
      if ($scope.disableDates) {
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
      // If disabled
      if ($scope.disableDates) {
        return false;
      }
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

    $scope.toggleOpenWholeDayOn = function(dayIndex) {
      if ($scope.isOpenWholeDayOn(dayIndex)) {
  			var loadedHours = $scope.loadedOpeningHours[dayIndex].hours,
  					defaultHours = defaultOpeningHours[dayIndex].hours[0],
  					currentHours = $scope.form.input.openingHours[dayIndex].hours;

				angular.forEach(currentHours, function(hr, i) {
					if (_.isEmpty(loadedHours[i])) {
						hr.start = defaultHours.start;
  					hr.end = defaultHours.end;
  				} else {
  					hr.start = loadedHours[i].start;
  					hr.end = loadedHours[i].end;
  				}
				});
    	} else {
    		// open whole day
	      $scope.form.input.openingHours[dayIndex].hours = [{
	        start: $scope.hours[1],
	        end: _.last($scope.hours)
	      }];
    	}
    };
    $scope.isOpenWholeDayOn = function(dayIndex) {
      // Return
      var day = $scope.form.input.openingHours[dayIndex];
      return (day.hours.length === 1) &&
              day.hours[0].start === $scope.hours[1] &&
              day.hours[0].end === _.last($scope.hours);
    };

    $scope.toggleAppointment = function() {
      $scope.form.input.openByAppointment = !$scope.form.input.openByAppointment;
      $scope.toggleDates($scope.form.input.openByAppointment);
    };

    $scope.isAlwaysOpen = false;
    $scope.disableDates = false;

    $scope.toggleAlwaysOpen = function() {
    	if ($scope.isAlwaysOpen) {
    		$scope.isAlwaysOpen = false;
    		angular.forEach($scope.form.input.openingHours, function(day, k) {
    			var loadedHours = $scope.loadedOpeningHours[k].hours,
    					defaultHours = defaultOpeningHours[k].hours[0];

  				angular.forEach(day.hours, function(hr, i) {
  					if (loadedHours[i]) {
  						hr.start = loadedHours[i].start;
    					hr.end = loadedHours[i].end;
    				} else {
    					hr.start = defaultHours.start;
    					hr.end = defaultHours.end;
    				}
  				});
        });
    	} else {
    		$scope.isAlwaysOpen = true;
    		angular.forEach($scope.form.input.openingHours, function(day) {
    			angular.forEach(day.hours, function(hr) {
    				hr.start = $scope.hours[1];
    				hr.end = _.last($scope.hours);
    			});
        });
    	}
      $scope.toggleDates($scope.isAlwaysOpen);
    };

    $scope.addSpecial = function() {
      // If disabled
      if ($scope.disableDates) {
        return false;
      }
      $scope.form.input.specialHours.push({
        date: '',
        startHour: '',
        endHour: ''
      });
    };
    $scope.removeSpecial = function(index) {
      // If disabled
      if ($scope.disableDates) {
        return false;
      }
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
      $scope.disableDates = ($scope.form.input.openByAppointment || $scope.isAlwaysOpen);
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
      // If there's special
      return $scope.hasOneSpecialDate();
    };
    // Watch special date
    $scope.$watch('hasSpecial()', function(current, prev) {

      if (current !== prev) {
        // Toggle
        $scope.toggleDates(current);
      }
    });

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
      input: {
        genres: [],
        artists: [],
        venue: [],
        openingHours: [],
        specialHours: []
      },
      dates: {
        start: $scope.today.clone().toDate(),//.format('YYYY-MM-DD'),
        end: $scope.today.clone().add(5, 'days').toDate()//.format('YYYY-MM-DD')
      },
      response: {

      },
      submit: function() {
        // Set this
        var _this = this;
        // Set photos
        _this.input.photos = $scope.photos;
        // Empty message
        this.response.message = '';
        // Post
        API.put('artcache/' + _this.input._id, _this.input).then(function(response) {
          // Set response
          _this.response = response.data;
          // If success
          if (_this.response.success) {
            // Reload artcache
            API.get('artcache').then(function(artResponse) {
              // Set artcache
              $window.artCache = artResponse.data.data;
              // Set message
              // _this.response.message = 'Event successfully updated';
              $scope.redirect = ['landing-artcache'];
            });
          }
          // if (_this.response.success && _this.response.data.permalink !== $state.params.permalink) {
          //   // Redirect to edit page
          //   $state.go('exhibition-edit', { permalink: _this.response.data.permalink });
          // }
        });
      }
    };

    $scope.loadExhibition();

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
]);
