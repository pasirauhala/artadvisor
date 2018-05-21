'use strict';

angular.module('main').controller('SearchController', SearchController);

SearchController.$inject = [
	'$rootScope',
	'$element',
	'$timeout',
	'$scope',
	'$resource',
	'$state',
	'$stateParams',
	'Authentication',
	'moment',
	'API',
	'location'
];

function SearchController($rootScope, $element, $timeout, $scope, $resource, $state, $stateParams, Authentication, moment, API, location) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.search = {
    q: $stateParams.q ? ($stateParams.q + '') : '',
    results: [],
    busy: false,
    limit: 10,
    forced: false,
    byCity: false,
    exec: function(force, byCity) {
      // Cancel timeout
      if ($scope.search.delay) {
        $timeout.cancel($scope.search.delay);
      }

      // Set timeout
      $scope.search.delay = $timeout(function() {

        // If force
        if (force) {
          // Empty string and dates
          $scope.search.q = '';
          $scope.where.city = '';
        }

        // If busy
        if ($scope.search.busy) {
          return false;
        }
        // If there's no q
        if (!force && !$scope.search.q.trim() && !byCity) {
          return false;
        }
        $scope.search.busy = true;
        // Do search
        API.get('search', {
          q: $scope.search.q,
          date: $scope.when.date.format('YYYY-MM-DD'),
          city: $scope.where.city,
          limit: $scope.search.limit
        }).then(function(response) {
          // Set results
          $scope.search.results = response.data;
          $scope.search.busy = false;
          // Set forced
          $scope.search.forced = !!force;
          $scope.search.byCity = !!byCity;
        });
      }, 1000);
    },
    delay: null,
    watch: function() {
      $scope.$watch('search.q', function(newValue, oldValue) {
        // If not equal
        if (newValue !== oldValue) {
          // Go to search page with q
          // $state.go('search', { q: $scope.search.q });
          $scope.search.exec();
        }
      });
      $scope.$watch('when.date', function(newValue, oldValue) {
        // If not equal
        if (newValue !== oldValue) {
          // Go to search page with q
          // $state.go('search', { q: $scope.search.q });
          $scope.search.exec(true);
        }
      });
      $scope.$watch('where.city', function(newValue, oldValue) {
        // If not equal
        if (newValue !== oldValue) {
          // Go to search page with q
          // $state.go('search', { q: $scope.search.q });
          $scope.search.exec();
        }
      });
    },
    suggestions: [],
    getSuggestions: function() {
      API.get('search/suggestions').then(function(response) {
        // Set it
        $scope.search.suggestions = response.data || [];
      });
    }
  };
  // Focus search
  angular.element($element).find('.main input[name="q"]:first').focus().select();

  $scope.main = {
    back: function() {
      return $state.go('landing-now');
      // return $rootScope.previousState ? $state.go($rootScope.previousState) : $state.go('landing-now');
    },
    settings: function() {
      $state.go('settings');
    }
  };

  var today = moment.utc();
  // Next weekend
  var nextWeekend = today.clone();

  while (true) {
    nextWeekend.add(1, 'days');
    // If monday
    if (nextWeekend.isoWeekday() === 1) {
      // Find next weekend
      while (nextWeekend.isoWeekday() <= 5) {
        nextWeekend.add(1, 'days');
      }
      break;
    }
  }

  $scope.when = {

    active: false,
    date: today.clone(),

    days: [
      {
        title: 'Today',
        date: today
      },
      {
        title: 'Next weekend',
        date: nextWeekend
      },
      {
        title: 'Next 7 days',
        date: today.clone().add(7, 'days')
      }
    ],
    activeDay: function(date) {
      return date.format('YYYY-MM-DD') === this.date.format('YYYY-MM-DD');
    },

    calendars: [
      {
        month: today.clone().format('YYYY-MM'),
        show: true
      },
      {
        month: today.clone().add(1, 'months').format('YYYY-MM'),
        show: true
      },
      {
        month: today.clone().add(2, 'months').format('YYYY-MM'),
        show: true
      }
    ],

    rangeCache: null,
    rawRange: function() {
      // If there's nothing
      if (!$scope.when.rangeCache) {
        // Create cache
        $scope.when.rangeCache = {
          start: today.clone().startOf('month'),
          end: today.clone().add(3, 'months').startOf('month')
        };
      }
      // Return
      return $scope.when.rangeCache;
    },

    range: function() {
      // Get raw
      var raw = $scope.when.rawRange();
      // Return
      return {
        start: raw.start.format('YYYY-MM-DD'),
        end: raw.end.format('YYYY-MM-DD')
      };
    },

    // All events within schedule
    inSchedules: [],
    // Schedules cache
    schedules: {},

    // Get schedule
    getSchedules: function() {
      API.get('events/schedules', $scope.when.range()).then(function(response) {
        // Put in schedules
        $scope.when.inSchedules = response.data || [];
        // Loop
        $scope.when.inSchedules.forEach(function(inSchedule) {
          // Convert dates to moment
          inSchedule.startDate = moment.utc(inSchedule.startDate);
          inSchedule.endDate = moment.utc(inSchedule.endDate);
        });
      });
    },

    pick: function(date) {
      this.date = date;
      $timeout(function() {
        $scope.when.active = false;
      }, 400);
    },
    watch: function() {
      $scope.$watch('search.date', function(newValue, oldValue) {
        // If not equal
        if (newValue !== oldValue) {
          // Go to search page with q
          // $state.go('search', { q: $scope.search.q });
          $scope.search.exec();
        }
      });
    },

    hasSchedule: function(day) {
      // If there's any
      if (day) {
        // Convert
        var date = day.format('YYYY-MM-DD');
        // If there's in schedules
        if ($scope.when.inSchedules.length) {
          // Check if there's schedules
          if (typeof $scope.when.schedules[date] !== 'undefined') {
            // Return
            return $scope.when.schedules[date];
          }
          // In schedule
          var inSchedule = false;
          // Loop through inSchedules
          for (var i in $scope.when.inSchedules) {
            // Get exhibition
            var exhibition = $scope.when.inSchedules[i];
            // If in schedule
            if (day.diff(exhibition.startDate, 'days') >= 0 &&
                day.diff(exhibition.endDate, 'days') < 0) {
              // Set it
              inSchedule = true;
              // Quit loop
              break;
            }
          }
          // Add nothing
          $scope.when.schedules[date] = inSchedule;
          // Return
          return inSchedule;
        }
      }
      // Return
      return false;
    }

  };

  $scope.where = {
    q: '',
    active: false,
    city: '',
    cities: [],
    delay: null,
    setActive: function(city) {
      $timeout(function() {
        $scope.where.city = city;
        $scope.where.q = '';
        $scope.cities = [];
        $scope.where.active = false;
      }, 1);
    },
    search: function() {
      // Do search
      API.get('search/cities', { q: $scope.where.q }).then(function(response) {
        // Set cities
        $scope.where.cities = response.data.data || [];
      });
    },
    watch: function() {
      $scope.$watch('where.q', function(newValue, oldValue) {
        if (newValue !== oldValue) {
          if ($scope.where.delay) {
            $timeout.cancel($scope.where.delay);
          }
          $scope.where.delay = $timeout(function() {
            // Search
            $scope.where.search();
          }, 1000);
        }
      });
      $scope.$watch('where.city', function(newValue, oldValue) {
        // If not equal
        if (newValue !== oldValue) {
          // Go to search page with q
          // $state.go('search', { q: $scope.search.q });
          $scope.search.exec(false, !!$scope.where.city);
        }
      });
    }
  };

  $scope.save = {
    id: null,
    active: false,
    name: '',
    searches: [],
    select: function(s) {
      // Set q
      $scope.save.id = s.id;
      $scope.save.name = s.name;
      $scope.search.q = s.keyword;
      $scope.when.date = moment(s.date);
      $scope.where.city = s.city;
      $scope.save.active = false;
    },
    loadSearches: function() {
      if (!Authentication.token) {
        return false;
      }
      API.get('me/searches').then(function(response) {
        // Set searches
        $scope.save.searches = response.data.data || [];
      });
    },
    settings: function() {

    },
    remove: function(id) {
      if (!Authentication.token) {
        return false;
      }
      // Delete
      API.delete('me/searches/' + id).then(function() {
        // Reload
        $scope.save.loadSearches();
      });
    },
    saving: null,
    submit: function() {
      if ($scope.save.saving) {
        return false;
      }
      if (!$scope.search.q || !$scope.save.name || !$scope.where.city) {
        return false;
      }
      $scope.save.saving = true;
      API.post('me/searches', {
        name: $scope.save.name,
        keyword: $scope.search.q,
        date: $scope.when.date,
        city: $scope.where.city
      }).then(function(response) {
        // Load searches
        $scope.save.loadSearches();
        $scope.save.saving = false;
        // Reset
        $scope.save.name = '';
      });
    }
  };


  $scope.search.getSuggestions();

  // Do watch
  $scope.search.watch();
  // Exec
  $scope.search.exec();

  // Watch
  $scope.where.watch();
  // Load searches
  $scope.save.loadSearches();

  // Get city
  location.cityPromise.then(function() {
    // Where
    $scope.where.city = location.city;
  });

  $scope.when.getSchedules();

}
