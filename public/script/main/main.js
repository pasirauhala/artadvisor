'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'mean';
	var applicationModuleVendorDependencies = [
		'ngResource',
		'ngAnimate',
		'ui.router',
		'ui.utils',
		'wu.masonry',
		'angularMoment',
		'duScroll',
		'infinite-scroll',
		'hmTouchEvents',
		'uiGmapgoogle-maps',
		'checklist-model',
		'ngFileUpload',
		'ngTagsInput',
		'ngMask',
		'geolocation',
		'datePicker',
		'720kb.tooltips',
		'720kb.socialshare'
	];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);
		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();

'use strict';

//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider',
	function($locationProvider) {
		$locationProvider.html5Mode(true).hashPrefix('!');
	}
]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#!';

	//Then init the app
	angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';

// Use Application configuration module to register a new module
ApplicationConfiguration.registerModule('main');

'use strict';

// Authentication service for token
angular.module('main').factory('Authentication', ['$window', '$q', '$http', function($window, $q, $http) {
  // Load user
  var user = null;

  // Set authentication
  var authentication = {
    token: $window.token,
    user: null,
    promise: null
  };

  /**
   * Initialize a promise
   */
  authentication.swear = function() {
    // Create promise
    var deferred = $q.defer();
    // Get user
    $http.get('/api/me', { params: { token: $window.token } }).then(function(response) {
      // Make sure there's no exception
      if (!response.data.exception) {
        // Set user
        authentication.user = response.data;
      }
      // Resolve
      deferred.resolve(authentication);
    });
    // Set promise
    authentication.promise = deferred.promise;
    // Return
    return authentication;
  };

  // Swear and return authentication
  return authentication.swear();
}]);

'use strict';

// Language Service
angular.module('main').factory('LangSvc', LanguageService);

LanguageService.$inject = [
	'Authentication',
	'APP_KEYS'
];

function LanguageService(Authentication, APP_KEYS) {
	var language = 'en',
			service = {
        init: init,
        getLanguage: getLanguage,
        setLanguage: setLanguage
    	};

  init();

  return service;

  ////////////////////////////////////////////////

  function init() {
  	var userLang = $.cookie(APP_KEYS.cookieLangKey);

  	if (Authentication.token) {
  		Authentication.promise.then(function(auth) {
	  		if (auth.user) {
	  			language = setLanguage(auth.user.lang);
	  		}
  		});
		} else {
			if (userLang) {
				language = userLang;
			}
		}
  }

  function getLanguage() {
  	return language;
  }

  function setLanguage(lang) {
  	language = lang;
  	// reset language cookie
  	$.cookie(APP_KEYS.cookieLangKey, lang, { expires: 30, path: '/' });

  	return getLanguage();
  }
}

'use strict';

// Middleware service for token
angular.module('main').service('Middleware', ['Authentication', '$state', function(Authentication, $state) {
  // Return middleware
  var filters = {
    // Must not be logged in
    notLoggedIn: function(state, params) {
      if (!Authentication.token) {
        // Exit
        return true;
      }
      $state.go('landing-now');
      return false;
    },
    // Must be logged in
    loggedIn: function(state, params) {
      if (Authentication.token) {
        // Redirect to authentication
        return true;
      }
      $state.go('authentication', {
        next: $state.href(state.name, params)
      });
      return false;
    }
  };

  this.filter = function(state, params) {
    // If there's no filter
    if (!state || !state.filters) {
      return true;
    }
    // Loop through filters
    for (var i in state.filters) {
      // Call
      if (!filters[state.filters[i]](state, params)) {
        return false;
      }
    }
    return true;
  };

}]);

'use strict';

// API Service
angular.module('main').service('API', ['$http', '$state', '$q', 'Authentication', function($http, $state, $q, Authentication) {
  // Set this
  var _this = this;
  // Set api root
  this.root = '/api/';
  // Cleanup endpoint
  var cleanEndPoint = function(endpoint) {
    return _this.root + (endpoint.charAt(0) === '/' ? endpoint.substr(1) : endpoint);
  };
  // Embed token
  var embedToken = function(query) {
    // Set token
    if (Authentication.token) {
      query.token = Authentication.token;
    }
    return query;
  };

  // Exception handler
  var handleException = function(exception, response) {
    // Select group
    switch (exception.group) {
      // If general
      case 'general':
        // Alert
        console.log(response);
        alert(exception.message);
        break;
      // If unauthorized
      case 'unauthorized':
        // Clear token
        Authentication.token = null;
        // Redirect to login page with error message
        $state.go('authentication', {
          action: 'login',
          message: 'Please login',
          next: $state.href($state.current.name, $state.params)
        });
        break;
    }
    // Return exception
    return exception;
  };

  // Filter
  var filter = function(promise) {
    // Defer
    var deferred = $q.defer();
    // Check
    promise.then(function(response) {
      // Resolve
      deferred.resolve(response);
    }, function(response) {
      // Handle exception
      if (response.data && response.data.exception) {
        deferred.reject(handleException(response.data.exception, response));
      }
    });
    // Return promise
    return deferred.promise;
  };

  // Perform get
  this.get = function(endpoint, query) {
    // Do get
    return filter($http.get(cleanEndPoint(endpoint), { params: embedToken(query || {}) }));
  };
  this.post = function(endpoint, data, query) {
    // Do post
    return filter($http.post(cleanEndPoint(endpoint), data, { params: embedToken(query || {}) }));
  };
  // Perform put
  this.put = function(endpoint, data, query) {
    // Do put
    return filter($http.put(cleanEndPoint(endpoint), data, { params: embedToken(query || {}) }));
  };
  // Perform delete
  this.delete = function(endpoint, query) {
    // Do delete
    return filter($http.delete(cleanEndPoint(endpoint), { params: embedToken(query || {}) }));
  };

}]);

'use strict';

/**
 * Location provider
 */

angular.module('main').provider('location', function() {

  var degreesToRadius = function(degrees) {
    return degrees * (Math.PI/180);
  };
  
  var calculateDistance = function(lat1, lng1, lat2, lng2) {
    var R = 6371; // Radius of the earth in km
    var dLat = degreesToRadius(lat2-lat1); 
    var dLon = degreesToRadius(lng2-lng1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(degreesToRadius(lat1)) * Math.cos(degreesToRadius(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  };

  this.$get = [
    'geolocation', '$q', '$rootScope', '$timeout', 'uiGmapGoogleMapApi', 'API', 
    function(geolocation, $q, $rootScope, $timeout, uiGmapGoogleMapApi, API) {
    // Create a promise
    var location = {}, 
        deferred = $q.defer();
    // Set promise
    location.promise = deferred.promise;

    // City promise
    var cityDeferred = $q.defer();
    // Set city promise
    location.cityPromise = cityDeferred.promise;

    // Set city
    location.city = '';

    // Get location promise
    var getLocation = geolocation.getLocation({
      timeout: 20000
    });

    var getCurrent = $q.defer();

    // Process coords
    var processCoordinates = function() {
      // Execute promise
      deferred.resolve(location);

      // Get current location
      API.get('location/current', {
        coords: [location.current.latitude, location.current.longitude].join(',')
      }).then(function(response) {
        // If there's any
        if (response.data.name) {
          // Change in city
          $rootScope.$broadcast('$changeCity', response.data, true);
        }
        // Always resolve
      }).finally(getCurrent.resolve);
    };

    // Get location
    getLocation.then(function(data) {
      // Set current location
      location.current = data.coords;
      // process
      processCoordinates();
    }).catch(function() {
      // Set default coords
      location.current = {
        latitude: 60.1698557,
        longitude: 24.938379
      };
      // Process
      processCoordinates();
    });

    // Wait for googleMaps and getLocation
    $q.all([uiGmapGoogleMapApi, getLocation, getCurrent.promise]).then(function(responses) {
      // Maps is first response
      var maps = responses[0], coords = responses[1].coords;
      // Create latLng
      var latLng = new maps.LatLng(coords.latitude, coords.longitude);
      // Create geocoder
      var geocoder = new maps.Geocoder();
      // Geocode current coords
      geocoder.geocode({ latLng: latLng }, function(results, status) {
        // Check if ok
        if (status.toUpperCase() === 'OK') {
          // Find in results
          var address = results.find(function(item) {
            // Check for address_components
            if (!item.address_components) {
              // Return false
              return false;
            }
            // Search address_components
            return !!item.address_components.find(function(ac_item) {
              // If there's type and type has 'locality'
              var found = ac_item.types && (ac_item.types.indexOf('locality') >= 0);
              // If found
              if (found) {
                // Set city
                location.city = ac_item.long_name || ac_item.short_name || '';
                // If there's no city
                if (!location.city) {
                  // Set found to false
                  found = false;
                }
              }
              // Return found
              return found;
            });
          }) || '';
        }
        // Resolve city
        cityDeferred.resolve(location);
      });
    });

    // Calculate distance
    location.distance = function(coords1, coords2) {
      // If there's no coords2
      if (!coords2) {
        // Set current distance
        coords2 = location.current;
      }

      if (!coords1 || !coords1.latitude || !coords2 || !coords2.latitude) {
        // Return -1
        return -1;
      }

      // Return
      return calculateDistance(coords1.latitude, coords1.longitude, coords2.latitude, coords2.longitude);
    };
    // Format
    location.format = function(distance) {
      // If no distance
      if (distance < 0) {
        // Return 'calculating'
        return 'Calculating distance...';
      }
      // If less than 1 km
      if (distance < 1) {
        // Return
        return Math.round(distance / 1000) + 'm';
      } else {
        // Return
        return distance.toFixed(3) + 'km';
      }
    };

    // Return location
    return location;
  }];
});
'use strict';

/**
 * Dynamic calendar
 * Fully customizable calendar utilizing moment.js
 * @author Ronald Borla
 */

// Calendar directive
angular.module('main').directive('calendar', ['moment', function(moment) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {
    // Weekdays
    var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Constants
    var DEFAULT_START_OF_WEEK = 1;

    // Set parent
    $scope.parent = $scope.$parent;

    // Get start of week
    var getStartOfWeek = function(startOfWeek) {
      for (var i in weekdays) {
        // Parse i
        i = parseInt(i);
        // Check
        if (parseInt(startOfWeek) === (i + 1) ||
            weekdays[i].toLowerCase().indexOf(startOfWeek) === 0) {
          // Return
          return (i + 1);
        }
      }
      // 1 is default for Monday
      return DEFAULT_START_OF_WEEK;
    };

    // Options
    var options = {
      startOfWeek: getStartOfWeek($attr.startOfWeek || DEFAULT_START_OF_WEEK)
    };

    // Set month
    $scope.month = $attr.month ? moment($attr.month + '-01') : moment();

    // Set weekdays
    $scope.weekdays = [];

    // Initialize weekdays
    (function initializeWeekdays() {
      // Weekday count
      var weekdaysCount = weekdays.length, weekStart = options.startOfWeek;
      // Loop
      while (weekdaysCount > 0) {
        // Add to weekdays
        $scope.weekdays.push(moment().isoWeekday(weekStart));
        // Increment weekStart
        weekStart++;
        // If exceed length
        if (weekStart > weekdays.length) {
          // Reset to 1
          weekStart = 1;
        }
        weekdaysCount--;
      }
    })();

    // Monthdays
    var monthDays = $scope.month.daysInMonth();
    // Get start of month
    var startOfMonth = $scope.month.clone().startOf('month');
    // First weekday of the month
    var firstWeekday = startOfMonth.isoWeekday();

    // Reorder week according to startOfWeek
    var weekOrder = [], weekCounter = weekdays.length;
    while (weekCounter > 0) {
      // Correct weekday
      var correctWeekday = options.startOfWeek + (weekdays.length - weekCounter);
      // If correct weekday exceeds length
      if (correctWeekday > weekdays.length) {
        // Reduce by difference
        correctWeekday = correctWeekday - weekdays.length;
      }
      // Push
      weekOrder.push(correctWeekday);
      weekCounter--;
    }

    $scope.alert = function(obj) {
      console.log(obj);
    };

    // Weeks
    $scope.weeks = [];

    // Day counter
    var dayCounter = 0;

    // Is active
    $scope.isActive = function(date) {
      // Match
      return (date && $scope.date) ? (date.format('YYYY-MM-DD') === $scope.date.format('YYYY-MM-DD')) : false;
    };

    // Fill
    var fill = true;

    // While true
    while (fill) {
      // Set days
      var days = [];
      // Loop through weekorder
      for (var k in weekOrder) {
        // Check if next day matches current week
        if (((dayCounter > 0) || (firstWeekday === weekOrder[k])) && fill) {
          // Clone
          var date = startOfMonth.clone().add(dayCounter, 'days');
          // Add date
          days.push(date);
          // Increment dayCounter
          dayCounter++;
          // If exceeds
          if (dayCounter >= monthDays) {
            // Remove fill
            fill = false;
          }
        } else {
          // Add null to days
          days.push(null);
        }
      }
      // Add to weeks
      $scope.weeks.push(days);

      // console.log(days);
    }

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };
  // Return directive
  return {
    link: link,
    scope: {
      date: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);
'use strict';

/**
 * Comments directive for Art Advisor
 * @author Ronald Borla
 */

// Comments directive
angular.module('main').directive('comments', ['API', '$window', 'Authentication', '$state', function(API, $window, Authentication, $state) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {
    // All comments
    $scope.comments = [];
    // Set count
    $scope.count = 0;

    $scope.query = {
      start: $attr.start || 0,
      limit: $attr.limit || 5,
      earliest: null
    };

    $scope.last = false;

    // Reset
    $scope.reset = function() {
      // Reset comments
      $scope.comments = [];
      // Set start
      $scope.query.start = $attr.start || 0;
      // Return scope
      return $scope;
    };

    var $thisScope = $scope;

    // Push comment
    $scope.pushComment = function(comment, first) {
      // To comments
      if (!!first) {
        $scope.comments.unshift(comment);
        // Set as earliest
        $scope.query.earliest = comment.created || null;
      } else {
        $scope.comments.push(comment);
      }
      // Increment start
      $scope.query.start++;
    };

    $scope.busy = false;

    // Load comments
    $scope.load = function() {
      // If busy
      if ($scope.busy) {
        return false;
      }
      $scope.busy = true;
      // Do load
      API.get($scope.source, $scope.query).then(function(response) {

        $scope.last = !!response.data.last;

        // Set count
        $scope.count = response.data.count;
        // If there's data
        if (response.data.data) {
          // Push
          for (var i in response.data.data) {
            // Push comment
            $scope.pushComment(response.data.data[i], true);
          }
        }
        $scope.busy = false;
      });
      // Return scope
      return $scope;
    };

    // Submit comment
    $scope.submit = function() {
      // If busy
      if ($scope.busy || !angular.element.trim($scope.content)) {
        return false;
      }
      $scope.busy = true;
      // Post
      API.post($scope.source, { content: $scope.content }).then(function(response) {
        // Push comment
        $scope.pushComment(response.data);
        $scope.count++;
        $scope.busy = false;

        $scope.content = '';
      });
    };

    // Can delete
    $scope.canRemove = function(comment) {
      // Return
      return Authentication.token &&
            ((comment.owner === Authentication.user._id || comment.owner._id === Authentication.user._id) ||
             $window.admin ||
             ($scope.owners && ($scope.owners.indexOf(Authentication.user._id) >= 0)));
    };

    // Delete comment
    $scope.remove = function(comment) {
      // Sure
      if (!confirm('Are you sure you want to remove this comment?\n\nPress OK to proceed')) {
        return false;
      }
      // Delete by using source
      API.delete($scope.source + '/' + comment._id).then(function(response) {
        // Found
        var index = '';
        // Loop through comments
        for (var i in $scope.comments) {
          // If found
          if ($scope.comments[i]._id === comment._id) {
            // Found
            index = i;
            break;
          }
        }
        // Remove
        $scope.comments.splice(index, 1);
      });
    };

    // Artist page
    $scope.artistPage = function(comment, defaultPage) {
      // If not artist
      if (!comment.owner.isArtist) {
        // Return defaultPage
        return defaultPage || '';
      }
      // Return state
      return $state.href('artist', { username: comment.owner.username });
    };

    // Owner name
    $scope.ownerName = function(comment) {
      // Return
      return comment.owner.name.full;
    };

    // Watch for commentSource
    $scope.$watch('source', function(current, prev) {
      if (current !== prev) {
        // Do load
        $scope.reset().load();
      }
    });

    if ($scope.source) {
      // Load
      $scope.reset().load();
    }

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };
  // Return directive
  return {
    link: link,
    scope: {
      source: '=',
      owners: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);
'use strict';

/**
 * Redirector
 */
angular.module('main').directive('redirector', ['$window', '$timeout', '$state', function($window, $timeout, $state) {

  var link = function($scope, $element, $attributes, $controllers, $transclude) {
    // Get seconds
    $scope.$seconds = $scope.seconds || 5;
    // The window
    var theWindow = angular.element($window);

    var reposition = function() {
      // Get window height
      var wrap = $element.find('.redirector-wrap:first'),
          marginTop = (theWindow.height() / 2) - (wrap.height() / 2);
      // Change margin Top
      wrap.css('margin-top', marginTop + 'px');
    };

    $scope.$on('windowResized', function($event) {
      // Reposition
      reposition();
    });

    var countdown = function() {
      // If less than 1
      if ($scope.$seconds <= 0) {
        // Do redirect
        $state.go($scope.state[0], $scope.state[1]);
      } else {
        // Wait first
        $timeout(function() {
          // Reduce
          $scope.$seconds--;
          // Countdown
          countdown();
        }, 1000);
      }
    };

    var redirecting = false;

    // Watch
    $scope.$watch('state', function(current, prev) {
      if (current !== prev && current && !redirecting) {
        // Do it
        redirecting = true;
        $element.addClass('show');
        // Countdown
        countdown();
      }
    });

    // Use transclude
    $transclude($scope, function(clone, scope) {
      // Replace
      $element.append(clone);
      reposition();
    });
  };

  // Return
  return {
    link: link,
    scope: {
      state: '=',
      seconds: '=?'
    },
    transclude: true,
    restrict: 'E'
  };
}]);
'use strict';

/**
 * Redirector
 */
angular.module('main').directive('confirm', ['$window', '$timeout', '$state', function($window, $timeout, $state) {

  var link = function($scope, $element, $attributes, $controllers, $transclude) {
    // The window
    var theWindow = angular.element($window);

    var reposition = function() {
      // Get window height
      var wrap = $element.find('.confirm-wrap:first'),
          marginTop = (theWindow.height() / 2) - (wrap.height() / 2);
      // Change margin Top
      wrap.css('margin-top', marginTop + 'px');
    };

    $scope.$on('windowResized', function($event) {
      // Reposition
      reposition();
    });

    $scope.$cancel = function() {
      // Remove show
      $scope.show = false;
    };

    // Watch
    $scope.$watch('show', function(current, prev) {
      // If true
      if (current !== prev) {
        // Show
        if (current) {
          // Add
          $element.addClass('show');
          reposition();
        } else {
          // Remove
          $element.removeClass('show');
        }
      }
    });

    // Use transclude
    $transclude($scope, function(clone, scope) {
      // Replace
      $element.append(clone);
    });
  };

  // Return
  return {
    link: link,
    scope: {
      action: '=',
      show: '='
    },
    transclude: true,
    restrict: 'E'
  };
}]);
'use strict';

/**
 * Popup for Art Advisor
 */

angular.module('main').directive('popup', ['$rootScope', function($rootScope) {

  var link = function($scope, $element, $attributes, $controllers, $transclude) {
    // Watch an event
    $scope.$on('openPopup', function(evt, name) {
      // If name matches
      if (name === $scope.name) {
        // Show popup
        $element.addClass('open');
      }
    });
    // Close
    $scope.$on('closePopup', function(evt, name) {
      // Remove
      if (name === $scope.name) {
        // Close
        $scope.close();
      }
    });

    $scope.close = function() {
      // Remove open
      $element.removeClass('open');
      // Call close
      if ($scope.closed) {
        // Call
        console.log($scope.closed);
        $scope.$eval($scope.closed);
      }
    };

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };

  return {
    link: link,
    restrict: 'E',
    scope: {
      name: '=',
      closed: '@'
    },
    transclude: true
  };
}]);
'use strict';

/**
 * User photo directive
 */

angular.module('main').directive('photo', ['Authentication', function(Authentication) {

  var link = function($scope, $element) {
    // Set user
    $scope.user = $scope.user || null;
    // Set background image first to empty
    $element.css('background-image', '');

    // Set source
    var setSource = function() {
      // If still no source
      if (!$scope.user.photo || !$scope.user.photo.source) {

        $element.removeClass('sourced');
        // Exit
        return false;
      }
      // Set source
      var source = $scope.user.photo.source;
      // If first character is not /
      if (source.charAt(0) !== '/') {
        // Set it
        source = '/' + source;
      }
      // Add url
      source = 'url(\'' + source.replace('\'', '\\\'') + '\')';
      // Set photo
      $element.css('background-image', source)
              .addClass('sourced');
    };

    // If there's no user
    if (!$scope.user) {
      // Get user
      Authentication.promise.then(function() {
        // Set user
        $scope.user = Authentication.user;
      });
    }

    // Watch user
    $scope.$watch('user', function(current, prev) {
      // Make sure there's user
      if ($scope.user && $scope.user.photo) {
        // Set source
        setSource();
      }
    });
  };

  return {
    link: link,
    scope: {
      user: '=?'
    },
    restrict: 'E'
  };
}]);
'use strict';

/**
 * Carousel bundle
 */
angular.module('main')
  /**
   * The carousel directive
   */
  .directive('carousel', ['$q', '$timeout', function($q, $timeout) {

    var listeners = {};

    var link = function($scope, $element) {


    };

    var controller = ['$element', '$scope', function($element, $scope) {

      // Wait till ready
      var ready = $q.defer(), isReady = false;

      // Set element
      $scope.$element = $element;
      // On ready
      $scope.$ready = ready.promise;
      // Is ready
      $scope.$isReady = function() {
        // Return
        return isReady;
      };

      // Fire event
      var fireEvent = function(event, args) {
        // Loop through listeners
        if (listeners[event]) {
          listeners[event].forEach(function(item) {
            // Call
            item.apply($scope, args);
          });
        }
      };

      // On
      $scope.listen = function(event, callback) {
        // If there's no listener
        if (!listeners[event]) {
          // Create
          listeners[event] = [];
        }
        // Push
        listeners[event].push(callback);
      };

      // Get width
      $scope.width = function() {
        // Return width
        return $element.width();
      };

      $scope.control.focus = function(index) {
        // Fire focus
        fireEvent('focus', [index]);
      };

      $scope.control.ready = $scope.$ready;
      $scope.control.isReady = $scope.$isReady;

      // Watch
      $scope.$watch('width()', function(current, prev) {
        // If not yet initialized
        if (!isReady && current > 100) {
          // Initialize
          isReady = true;
          // Resolve ready
          ready.resolve($scope);

          console.log('--Carousel Width--');
          console.log(current);
        }
        // If not the same
        fireEvent('carouselWidthChanged', [current]);
      });

      return $scope;
    }];

    return {
      link: link,
      controller: controller,
      restrict: 'A',
      scope: {
        control: '=carousel'
      }
    };
  }])
  /**
   * The carousel container
   */
  .directive('carouselList', [function() {

    var link = function($scope, $element, $attributes, $parent) {

      $scope.$carousel = $parent;

    };

    var controller = ['$element', '$scope', function($element, $scope) {

      // Set element
      $scope.$element = $element;

      // Recalculate width
      $scope.recalculateWidth = function() {
        // If not ready
        if (!$scope.$carousel.$isReady()) {
          return false;
        }
        // Total width
        var totalWidth = 0;
        // Get items
        $element.find('[carousel-item], [data-carousel-item]').each(function() {
          // Increment total width
          totalWidth += angular.element(this).width();
        });
        // Set the width
        $element.css('width', totalWidth + 'px');
      };

      return $scope;
    }];

    return {
      link: link,
      controller: controller,
      restrict: 'A',
      require: '^carousel',
      scope: {
        options: '=carouselList'
      }
    };
  }])
  /**
   * The carousel item
   */
  .directive('carouselItem', [function() {

    var link = function($scope, $element, $attributes, $parent) {

      // Set list
      $scope.$list = $parent;

      // On parent ready
      $scope.$list.$carousel.$ready.then(function($carousel) {
        // Recalculate width
        $scope.recalculateWidth();
      });

      // Listen focus
      $scope.$list.$carousel.listen('focus', function(index) {
        // Check index
        console.log(index);
      });
    };

    var controller = ['$element', '$scope', function($element, $scope) {

      // Set element
      $scope.$element = $element;

      // Update width
      $scope.recalculateWidth = function() {
        // Make sure it's ready
        if (!$scope.$list.$carousel.$isReady()) {
          return false;
        }
        // Set width
        var width = $scope.$list.$carousel.width() * $scope.options.width;
        // Get carousel element width
        $element.css('width', width + 'px');
      };

      // Get width
      $scope.width = function() {
        // Return this width
        return $element.width();
      };

      $scope.$watch('options.width', function(current, prev) {
        // Update width
        $scope.recalculateWidth();
      });

      // Watch width change
      $scope.$watch('width()', function(current, prev) {
        // Recalculate list width
        $scope.$list.recalculateWidth();
      });

      return $scope;
    }];

    return {
      link: link,
      controller: controller,
      restrict: 'A',
      require: '^carouselList',
      scope: {
        options: '=carouselItem'
      }
    };
  }]);
'use strict';

/**
 * Genre
 */
angular.module('main').factory('genres', [function() {

  // Return genres
  return [
    'ceramic art',
    'collage',
    'comics',
    'community art',
    'digital art',
    'drawing',
    'film',
    'games',
    'glass art',
    'illustration',
    'installation art',
    'land art',
    'light art',
    'media art',
    'painting',
    'participatory art',
    'performance art',
    'photography',
    'printmaking',
    'sculpture',
    'site specific art',
    'sound art',
    'street art',
    'textile art',
    'video art',
    'other',
  ];
}]);
'use strict';

// Translations
angular.module('main').factory('translations', ['$rootScope', '$window', 'API', function($rootScope, $window, API) {
  // Return all translations
  var translations = [
        {
            'en': 'About & Terms',
            'fi': 'K\u00e4ytt\u00f6ehdot',
            'sv': 'Om Art Advisor och Villkor',
            'de': 'About + AGB'
        },
        {
            'en': 'About and terms',
            'fi': 'K\u00e4ytt\u00f6ehdot',
            'sv': 'Anv\u00e4ndarvillkor',
            'de': 'Bedingungen'
        },
        {
            'en': 'Additional content',
            'fi': 'Lis\u00e4tietoja',
            'sv': 'Ytterligare inneh\u00e5ll',
            'de': 'Zus\u00e4tzliche Inhalte'
        },
        {
            'en': 'Address',
            'fi': 'Osoite',
            'sv': 'Adress',
            'de': 'Adresse'
        },
        {
            'en': 'Admission',
            'fi': 'P\u00e4\u00e4symaksu',
            'sv': 'Biljetter',
            'de': 'Aufnahmegeb\u00fchr'
        },
        {
            'en': 'Admission fee',
            'fi': 'Sis\u00e4\u00e4np\u00e4\u00e4symaksu',
            'sv': 'Intr\u00e4desavgift',
            'de': 'Aufnahmegeb\u00fchr'
        },
        {
            'en': 'All Rights Reserved',
            'fi': 'Kaikki oikeudet pid\u00e4tet\u00e4\u00e4n',
            'sv': 'Alla r\u00e4ttigheter f\u00f6rbeh\u00e5llna.',
            'de': 'Alle Rechte vorbehalten'
        },
        {
            'en': 'Apr',
            'fi': 'Huhti',
            'sv': 'April',
            'de': 'April'
        },
        {
            'en': 'Art Cache',
            'fi': 'Taidek\u00e4tk\u00f6',
            'sv': 'Exklusiv konstsamling',
            'de': 'Kunst Cache'
        },
        {
            'en': 'Art Cache Helsinki',
            'fi': 'Art Cache Helsinki',
            'sv': 'Art Cache Helsinki',
            'de': 'Art Cache Helsinki'
        },
        {
            'en': 'Art Genres',
            'fi': 'Taidelajit',
            'sv': 'Konstformer',
            'de': 'Genre'
        },
        {
            'en': 'Art View',
            'fi': 'Taiden\u00e4kym\u00e4',
            'sv': 'Visa konst',
            'de': 'Kunst Anzeigen'
        },
        {
            'en': 'Art genre',
            'fi': 'Taidelaji',
            'sv': 'Konstform',
            'de': 'Art genre'
        },
        {
            'en': 'Art genre(s) represented',
            'fi': 'Edustetut taidelajit',
            'sv': 'Representerade konstformer',
            'de': 'Kunstgenre'
        },
        {
            'en': 'Art lover',
            'fi': 'Taiteen yst\u00e4v\u00e4',
            'sv': 'Konstv\u00e4n',
            'de': 'Kunstliebhaber'
        },
        {
            'en': 'Art museum',
            'fi': 'Taidemuseo',
            'sv': 'Konstmuseum',
            'de': 'Kunstmuseum'
        },
        {
            'en': 'Artist',
            'fi': 'Taiteilija',
            'sv': 'Konstn\u00e4r',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'Artist run',
            'fi': 'Taiteilijavetoinen',
            'sv': 'Konstn\u00e4rsdrivet',
            'de': 'Produzentengalerie \/ artist run'
        },
        {
            'en': 'Artist studio',
            'fi': 'Taiteilijan ty\u00f6huone',
            'sv': 'Konstn\u00e4rens arbetsrum',
            'de': 'K\u00fcnstleratelier'
        },
        {
            'en': 'Artist(s)',
            'fi': 'Taiteilija(t)',
            'sv': 'Konstn\u00e4r(er)',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'Artists',
            'fi': 'Taiteilijat',
            'sv': 'konstn\u00e4rer',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'Aug',
            'fi': 'Elo',
            'sv': 'Aug',
            'de': 'August'
        },
        {
            'en': 'By joining Art Advisor, you agree to our',
            'fi': 'Liittym\u00e4ll\u00e4 Art Advisor:iin, hyv\u00e4ksyt',
            'sv': 'Genom att g\u00e5 med i Art Advisor, godk\u00e4nner du v\u00e5ra',
            'de': 'Mit Ihrer Anmeldung auf Art Advisor erkl\u00e4ren Sie sich mit Unseren'
        },
        {
            'en': 'By joining ArtAdvisor, you agree to our Terms of Service and Privacy Policy',
            'fi': 'Liittym\u00e4ll\u00e4 ArtAdvisor:iin, hyv\u00e4ksyt k\u00e4ytt\u00f6ehdot ja tietosuojak\u00e4yt\u00e4nn\u00f6t',
            'sv': 'Genom att g\u00e5 med i ArtAdvisor, godk\u00e4nner du v\u00e5ra villkor och v\u00e5r sekretesspolicy',
            'de': 'Mit Ihrer Anmeldung auf ArtAdvisor erkl\u00e4ren Sie sich mit Unseren Servicebedingungen sowie unserer Datenschutzerkl\u00e4rung einverstanden.'
        },
        {
            'en': 'Calculating distance',
            'fi': 'Laskee et\u00e4isyyden',
            'sv': 'R\u00e4kna avst\u00e5nd',
            'de': 'Entfernung berechnen'
        },
        {
            'en': 'Cancel',
            'fi': 'Peru',
            'sv': '\u00c5ngra',
            'de': 'L\u00f6schen'
        },
        {
            'en': 'Ceramic art',
            'fi': 'Keramiikka',
            'sv': 'Keramik',
            'de': 'Keramik-Kunst'
        },
        {
            'en': 'Change language',
            'fi': 'Vaihda kieli',
            'sv': '\u00c4ndra spr\u00e5k',
            'de': 'Sprache \u00e4ndern'
        },
        {
            'en': 'Change password',
            'fi': 'Vaihda salasana',
            'sv': '\u00c4ndra l\u00f6senord',
            'de': 'Passwort \u00e4ndern'
        },
        {
            'en': 'Change user type',
            'fi': 'Vaihda k\u00e4ytt\u00e4j\u00e4n tyyppi',
            'sv': '\u00c4ndra anv\u00e4ndartyp',
            'de': '\u00c4ndere den Benutzer-Typ'
        },
        {
            'en': 'Choose an existing venue',
            'fi': 'Valitse olemassa oleva paikka',
            'sv': 'V\u00e4lj en existerande plats',
            'de': 'W\u00e4hle eine bereits bestehende Veranstaltung'
        },
        {
            'en': 'Choose existing venue',
            'fi': 'Valitse tapahtumapaikka',
            'sv': 'V\u00e4lj plats f\u00f6r evenemang',
            'de': 'W\u00e4hle einen Veranstaltungsort'
        },
        {
            'en': 'Cities',
            'fi': 'Kaupungit',
            'sv': 'St\u00e4der',
            'de': 'St\u00e4dte'
        },
        {
            'en': 'Close account',
            'fi': 'Sulje k\u00e4ytt\u00e4j\u00e4tili',
            'sv': 'St\u00e4ng anv\u00e4ndarkontot',
            'de': 'Konto schliessen'
        },
        {
            'en': 'Closed today',
            'fi': 'Suljettu t\u00e4n\u00e4\u00e4n',
            'sv': 'St\u00e4ngt idag',
            'de': 'Heute geschlossen'
        },
        {
            'en': 'Collage',
            'fi': 'Kollaasi',
            'sv': 'Kollage',
            'de': 'Collage'
        },
        {
            'en': 'Comics',
            'fi': 'Sarjakuvataide',
            'sv': 'Seriekonst',
            'de': 'Comics'
        },
        {
            'en': 'Comments',
            'fi': 'Kommentit',
            'sv': 'Kommentarer',
            'de': 'Kommentare'
        },
        {
            'en': 'Commercial',
            'fi': 'Kaupallinen',
            'sv': 'Kommersielt',
            'de': 'Kommerziell'
        },
        {
            'en': 'Completing password reset',
            'fi': 'Salasana on nyt uusittu',
            'sv': 'Ditt l\u00f6senord har f\u00f6rnyats',
            'de': 'Passwort-Zur\u00fccksetzung abschliesen'
        },
        {
            'en': 'Contact',
            'fi': 'Yhteystiedot',
            'sv': 'Kontakt',
            'de': 'Kontakt'
        },
        {
            'en': 'Contemporary',
            'fi': 'Nykytaide',
            'sv': 'Nutidskonst',
            'de': 'Zeitgen\u00f6ssisch'
        },
        {
            'en': 'Create event',
            'fi': 'Luo tapahtuma',
            'sv': 'Skapa evenemang',
            'de': 'Erstelle eine Veranstaltung'
        },
        {
            'en': 'Create new event',
            'fi': 'Luo uusi tapahtuma',
            'sv': 'Skapa nytt evenemang',
            'de': 'Neue Veranstaltung'
        },
        {
            'en': 'Create new venue',
            'fi': 'Luo uusi paikka',
            'sv': 'skapa ny lokal',
            'de': 'Neuer Verastallungsort'
        },
        {
            'en': 'Curated by',
            'fi': 'J\u00e4rjest\u00e4j\u00e4',
            'sv': 'Arrangerat av',
            'de': 'Kuratiert von'
        },
        {
            'en': 'Curator studio',
            'fi': 'Kuraattorin ty\u00f6huone',
            'sv': 'Kuratorns arbetsrum',
            'de': 'Kuratorenb\u00fcro'
        },
        {
            'en': 'Current city',
            'fi': 'Nykyinen kaupunki',
            'sv': 'Nuvarande stad',
            'de': 'Aktuelle Stadt'
        },
        {
            'en': 'Date',
            'fi': 'P\u00e4iv\u00e4',
            'sv': 'Datum',
            'de': 'Tag'
        },
        {
            'en': 'Days',
            'fi': 'P\u00e4iv\u00e4t',
            'sv': 'Dagar',
            'de': 'Tage'
        },
        {
            'en': 'Dec',
            'fi': 'Joulu',
            'sv': 'Dec',
            'de': 'Dezember'
        },
        {
            'en': 'Digital art',
            'fi': 'Digitaalinen taide',
            'sv': 'Digital konst',
            'de': 'Digital Art'
        },
        {
            'en': 'Drawing',
            'fi': 'Piirrustus',
            'sv': 'Teckning',
            'de': 'Zeichnung'
        },
        {
            'en': 'ENG',
            'fi': 'FIN',
            'sv': 'SWE',
            'de': 'DE'
        },
        {
            'en': 'Edit event',
            'fi': 'Muokkaa tapahtumaa',
            'sv': 'Redigera evenemang',
            'de': 'Veranstaltung bearbeiten'
        },
        {
            'en': 'Edit profile',
            'fi': 'Muokkaa profiilia',
            'sv': 'Redigera profil',
            'de': 'Profil bearbeiten'
        },
        {
            'en': 'Edit venue',
            'fi': 'Muokkaa paikkaa',
            'sv': 'redigera lokal',
            'de': 'Verastallungsort bearbeiten'
        },
        {
            'en': 'Email',
            'fi': 'E-mail',
            'sv': 'E-post',
            'de': 'Email'
        },
        {
            'en': 'Email a friend',
            'fi': 'Jaa yst\u00e4v\u00e4lle',
            'sv': 'Dela med v\u00e4n',
            'de': 'E-Mail an einen Freund'
        },
        {
            'en': 'Email already in use',
            'fi': 'S\u00e4hk\u00f6postiosoite on jo k\u00e4yt\u00f6ss\u00e4',
            'sv': 'Denna e-post \u00e4r redan i anv\u00e4ndning',
            'de': 'E-Mail-Adresse wird bereits benutzt'
        },
        {
            'en': 'Enter admission fee(s) currency',
            'fi': 'Valitse sis\u00e4\u00e4np\u00e4\u00e4symaksun valuutta',
            'sv': 'V\u00e4lj valuta f\u00f6r intr\u00e4desavgift',
            'de': 'W\u00e4hle die W\u00e4hrung der Eintrittszahlung'
        },
        {
            'en': 'Event',
            'fi': 'Tapahtuma',
            'sv': 'Evenemang',
            'de': 'Veranstaltung'
        },
        {
            'en': 'Event name',
            'fi': 'Tapahtuman nimi',
            'sv': 'Namn p\u00e5 evenemang',
            'de': 'Name des Veranstaltung'
        },
        {
            'en': 'Event organizer',
            'fi': 'Tapahtumaj\u00e4rjest\u00e4j\u00e4',
            'sv': 'Arrang\u00f6r',
            'de': 'Veranstalter'
        },
        {
            'en': 'Event successfully created',
            'fi': 'Tapahtuma onnistuneesti luotu',
            'sv': 'Evenemanget skapat lyckat',
            'de': 'Die Veranstaltung wurde erfolgreich erstellt'
        },
        {
            'en': 'Events',
            'fi': 'Tapahtumat',
            'sv': 'Evenemang',
            'de': 'Veranstaltungen'
        },
        {
            'en': 'Facebook',
            'fi': 'Facebook',
            'sv': 'Facebook',
            'de': 'Facebook'
        },
        {
            'en': 'Favorites',
            'fi': 'Suosikit',
            'sv': 'Favoriter',
            'de': 'Favoriten'
        },
        {
            'en': 'Favourites',
            'fi': 'Suosikit',
            'sv': 'Favoriter',
            'de': 'Favoriten'
        },
        {
            'en': 'Feb',
            'fi': 'Helmi',
            'sv': 'Feb',
            'de': 'Februar'
        },
        {
            'en': 'Feedback',
            'fi': 'Palaute',
            'sv': 'Feedback',
            'de': 'R\u00fcckmeldung'
        },
        {
            'en': 'Film',
            'fi': 'Elokuva',
            'sv': 'Film',
            'de': 'Film'
        },
        {
            'en': 'Forest',
            'fi': 'Mets\u00e4',
            'sv': 'Skog',
            'de': 'Wald'
        },
        {
            'en': 'Forgot password?',
            'fi': 'Unohditko salasanan?',
            'sv': 'Gl\u00f6mt l\u00f6senordet?',
            'de': 'Passwort vergessen?'
        },
        {
            'en': 'Fri',
            'fi': 'Pe',
            'sv': 'Fre',
            'de': 'Fr'
        },
        {
            'en': 'Friday',
            'fi': 'Perjantai',
            'sv': 'Fredag',
            'de': 'Freitag'
        },
        {
            'en': 'Gallery',
            'fi': 'Galleria',
            'sv': 'Galleri',
            'de': 'Galerie'
        },
        {
            'en': 'Games',
            'fi': 'Pelit',
            'sv': 'Spel',
            'de': 'Spiele'
        },
        {
            'en': 'Genre',
            'fi': 'Laji',
            'sv': 'Genre',
            'de': 'Genre'
        },
        {
            'en': 'Glass art',
            'fi': 'Lasitaide',
            'sv': 'Glaskonst',
            'de': 'Glaskunst'
        },
        {
            'en': 'Go to map page',
            'fi': 'Siirry karttasivulle',
            'sv': 'G\u00e5 till kartsida',
            'de': 'Gehe zur Kartendienst-Seite'
        },
        {
            'en': 'Google',
            'fi': 'Google',
            'sv': 'Google',
            'de': 'Google'
        },
        {
            'en': 'Guestbook',
            'fi': 'Vieraskirja',
            'sv': 'G\u00e4stbok',
            'de': 'G\u00e4stebuch'
        },
        {
            'en': 'Historical',
            'fi': 'Historiallinen',
            'sv': 'Historisk',
            'de': 'Historisch'
        },
        {
            'en': 'Illustration',
            'fi': 'Kuvitus',
            'sv': 'Illustration',
            'de': 'illustration'
        },
        {
            'en': 'Information',
            'fi': 'Tiedot',
            'sv': 'Beskrivning av evenemang',
            'de': 'Veranstaltungsbeschreibung'
        },
        {
            'en': 'Installation art',
            'fi': 'Installaatiotaide',
            'sv': 'Installationskonst',
            'de': 'Installationskunst'
        },
        {
            'en': 'International',
            'fi': 'Kansainv\u00e4linen',
            'sv': 'Internationell',
            'de': 'International'
        },
        {
            'en': 'Invite friends',
            'fi': 'Kutsu yst\u00e4vi\u00e4',
            'sv': 'Bjud in v\u00e4nner',
            'de': 'Freunde einladen'
        },
        {
            'en': 'Jan',
            'fi': 'Tammi',
            'sv': 'Jan',
            'de': 'Januar'
        },
        {
            'en': 'Join',
            'fi': 'Liity',
            'sv': 'G\u00e5 med',
            'de': 'beitreten-Anmelden'
        },
        {
            'en': 'Join with Facebook',
            'fi': 'Liity Facebook:in avulla',
            'sv': 'G\u00e5 med via Facebook',
            'de': 'Anmelden mit Facebook'
        },
        {
            'en': 'Join with Google+',
            'fi': 'Liity Google + avulla',
            'sv': 'G\u00e5 med via Google+',
            'de': 'Anmelden mit Google+'
        },
        {
            'en': 'Jul',
            'fi': 'Hein\u00e4',
            'sv': 'Juli',
            'de': 'Juli'
        },
        {
            'en': 'Jun',
            'fi': 'Kes\u00e4',
            'sv': 'Juni',
            'de': 'Juni'
        },
        {
            'en': 'Keywords',
            'fi': 'Hakusanat',
            'sv': 'Nyckelord',
            'de': 'Schl\u00fcsselw\u00f6rter'
        },
        {
            'en': 'Land art',
            'fi': 'Maataide',
            'sv': 'Jordkonst',
            'de': 'Land-Art'
        },
        {
            'en': 'Last Chance',
            'fi': 'Viel\u00e4 ehdit',
            'sv': 'Sista chansen',
            'de': 'Letzte Chance'
        },
        {
            'en': 'Lifestyle',
            'fi': 'Lifestyle',
            'sv': 'Livsstil',
            'de': 'Lifestyle'
        },
        {
            'en': 'Light art',
            'fi': 'Valotaide',
            'sv': 'Ljuskonst',
            'de': 'Licht-Kunst'
        },
        {
            'en': 'Linked accounts',
            'fi': 'Linkitetyt tilit',
            'sv': 'L\u00e4nkade konton',
            'de': 'Verkn\u00fcpfte Konten'
        },
        {
            'en': 'Links to other page',
            'fi': 'Linkit muille sivuille',
            'sv': 'L\u00e4nkar till andra sidor',
            'de': 'Links to other page'
        },
        {
            'en': 'Links to other pages',
            'fi': 'Linkit muille sivuille',
            'sv': 'L\u00e4nkar till andra sidor',
            'de': 'Links zu anderen Seiten'
        },
        {
            'en': 'Load images',
            'fi': 'Lataa kuvia',
            'sv': 'Ladda bilder',
            'de': 'Bilder laden'
        },
        {
            'en': 'Log in',
            'fi': 'Kirjaudu sis\u00e4\u00e4n',
            'sv': 'Logga in',
            'de': 'Log in'
        },
        {
            'en': 'Log in with Facebook',
            'fi': 'Kirjaudu Facebook:in avulla',
            'sv': 'Logga in med Facebook',
            'de': 'Log in mit Facebook'
        },
        {
            'en': 'Log in with Google+',
            'fi': 'Kirjaudu Google + avulla',
            'sv': 'Logga in med Google+',
            'de': 'Log in mit Google+'
        },
        {
            'en': 'Mar',
            'fi': 'Maalis',
            'sv': 'Mars',
            'de': 'M\u00e4rz'
        },
        {
            'en': 'May',
            'fi': 'Touko',
            'sv': 'Maj',
            'de': 'Mai'
        },
        {
            'en': 'Media art',
            'fi': 'Mediataide',
            'sv': 'Mediekonst',
            'de': 'Medienkunst'
        },
        {
            'en': 'Message',
            'fi': 'Viesti',
            'sv': 'Meddelande',
            'de': 'Nachricht'
        },
        {
            'en': 'Modern',
            'fi': 'Moderni',
            'sv': 'Modern',
            'de': 'Modern'
        },
        {
            'en': 'Mon',
            'fi': 'Ma',
            'sv': 'M\u00e5n',
            'de': 'Mo'
        },
        {
            'en': 'Monday',
            'fi': 'Maanantai',
            'sv': 'M\u00e5ndag',
            'de': 'Montag'
        },
        {
            'en': 'Months',
            'fi': 'Kuukaudet',
            'sv': 'M\u00e5nader',
            'de': 'Monate'
        },
        {
            'en': 'Museum',
            'fi': 'Museo',
            'sv': 'Museum',
            'de': 'Museum'
        },
        {
            'en': 'My events',
            'fi': 'Minun tapahtumat',
            'sv': 'Mina evenemang',
            'de': 'Meine Veranstaltung'
        },
        {
            'en': 'My searches',
            'fi': 'Omat hakuni',
            'sv': 'Mina s\u00f6kningar',
            'de': 'Meine Suchen'
        },
        {
            'en': 'My venues',
            'fi': 'Minun paikat',
            'sv': 'mina lokaler',
            'de': 'Mein Verastaltungsort'
        },
        {
            'en': 'New password',
            'fi': 'Uusi salasana',
            'sv': 'Nytt l\u00f6senord',
            'de': 'Neues Passwort'
        },
        {
            'en': 'New password again',
            'fi': 'Uusi salasana uudestaan',
            'sv': 'Nytt l\u00f6senord igen',
            'de': 'Altes Passwort wiederholen'
        },
        {
            'en': 'Next 7 days',
            'fi': 'Seuraavan viikon ajan',
            'sv': 'N\u00e4sta 7 dagar',
            'de': 'N\u00e4chste 7 Tage'
        },
        {
            'en': 'Next weekend',
            'fi': 'Ensi viikonloppuna',
            'sv': 'N\u00e4sta helg',
            'de': 'N\u00e4chstes Wochenende'
        },
        {
            'en': 'Notifications',
            'fi': 'Ilmoitukset',
            'sv': 'Meddelande',
            'de': 'Mitteilungen'
        },
        {
            'en': 'Nov',
            'fi': 'Marras',
            'sv': 'Nov',
            'de': 'November'
        },
        {
            'en': 'Now',
            'fi': 'Nyt',
            'sv': 'Nu',
            'de': 'Jetzt'
        },
        {
            'en': 'Now closed',
            'fi': 'Suljetut',
            'sv': 'St\u00e4ngt',
            'de': 'Jetzt Geschlossen.'
        },
        {
            'en': 'Now open',
            'fi': 'Avoimet',
            'sv': '\u00d6ppet',
            'de': 'Jetzt ge\u00f6ffnet'
        },
        {
            'en': 'Oct',
            'fi': 'Loka',
            'sv': 'Okt',
            'de': 'Oktober'
        },
        {
            'en': 'Off',
            'fi': 'Pois',
            'sv': 'Av',
            'de': 'Aus'
        },
        {
            'en': 'Old password',
            'fi': 'Vanha salasana',
            'sv': 'Gammalt l\u00f6senord',
            'de': 'Altes Passwort'
        },
        {
            'en': 'On',
            'fi': 'P\u00e4\u00e4ll\u00e4',
            'sv': 'P\u00e5',
            'de': 'Ein'
        },
        {
            'en': 'On \/ Off',
            'fi': 'P\u00e4\u00e4ll\u00e4 \/ Pois',
            'sv': 'P\u00e5 \/ Av',
            'de': 'Ein \/ Aus'
        },
        {
            'en': 'Open dates',
            'fi': 'Aukiolop\u00e4iv\u00e4t',
            'sv': '\u00d6ppetdagar',
            'de': '\u00d6ffnungstage'
        },
        {
            'en': 'Open hours',
            'fi': 'Aukioloajat',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffnungszeiten'
        },
        {
            'en': 'Open today from',
            'fi': 'Avoinna t\u00e4n\u00e4\u00e4n',
            'sv': '\u00d6ppet idag',
            'de': 'Heute ge\u00f6ffnet von'
        },
        {
            'en': 'Opening hours',
            'fi': 'Aukioloajat',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffungzeiten'
        },
        {
            'en': 'Opening hours (for every weekday separately + holidays + other exceptional opening hours)',
            'fi': 'Aukioloajat  (valitse kaikki viikonp\u00e4iv\u00e4t erikseen + lomat + muut poikkeavat aukioloajat)',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffungzeiten'
        },
        {
            'en': 'Other',
            'fi': 'Muu',
            'sv': 'Annat',
            'de': 'Sonstiges'
        },
        {
            'en': 'Painting',
            'fi': 'Maalaustaide',
            'sv': 'M\u00e5leri',
            'de': 'Malerei'
        },
        {
            'en': 'Park',
            'fi': 'Puisto',
            'sv': 'Park',
            'de': 'Park'
        },
        {
            'en': 'Password does not match',
            'fi': 'Salasana ei t\u00e4sm\u00e4\u00e4',
            'sv': 'L\u00f6senordet st\u00e4mmer ej',
            'de': 'Das Passwort stimmt nicht'
        },
        {
            'en': 'Performance art',
            'fi': 'Performanssitaide',
            'sv': 'Performanskonst',
            'de': 'Performance-Kunst'
        },
        {
            'en': 'Phone number',
            'fi': 'Puhelin',
            'sv': 'Telefonnummer',
            'de': 'Telefonnummer'
        },
        {
            'en': 'Photography',
            'fi': 'Valokuvataide',
            'sv': 'Fotografi',
            'de': 'Fotografie'
        },
        {
            'en': 'Please add admission fee',
            'fi': 'Lis\u00e4\u00e4 p\u00e4\u00e4symaksu',
            'sv': 'L\u00e4gg till intr\u00e4desavgift',
            'de': 'F\u00fcge den Eintrittspreis hinzu'
        },
        {
            'en': 'Please add event name',
            'fi': 'Lis\u00e4\u00e4 tapahtuman nimi',
            'sv': 'L\u00e4gg till namn p\u00e5 evenemang',
            'de': 'F\u00fcge den Veranstaltungsnamen hinzu'
        },
        {
            'en': 'Please add the basic information about the event',
            'fi': 'Lis\u00e4\u00e4 tapahtuman tiedot',
            'sv': 'L\u00e4gg till information f\u00f6r evenemanget',
            'de': 'Bitte f\u00fcge Grundinformationen \u00fcber die Veranstaltung hinzu'
        },
        {
            'en': 'Please check your email for our instructions',
            'fi': 'Tarkista s\u00e4hk\u00f6postistasi tarkemmat ohjeet',
            'sv': 'Kontrollera din e-post f\u00f6r v\u00e5ra instruktioner',
            'de': 'Schau bitte in deinem E-Mail-Eingang nach'
        },
        {
            'en': 'Please check your new email address for verification',
            'fi': 'Tarkista vahvistusviesti uudesta s\u00e4hk\u00f6postiosoitteesta',
            'sv': 'Kontrollera din nya e-post',
            'de': 'Bitte pr\u00fcfe deine neue E-Mail-Adresse'
        },
        {
            'en': 'Please choose at least one art genre',
            'fi': 'Valitse v\u00e4hint\u00e4\u00e4n yksi taidelaji',
            'sv': 'V\u00e4lj minst en konstform',
            'de': 'W\u00e4hle wenigstens eine Kunstgattung'
        },
        {
            'en': 'Please choose at least one venue type under gallery \/ public space \/ art museum \/ other',
            'fi': 'Valitse v\u00e4hint\u00e4\u00e4n yksi tarkentava paikkatyyppi n\u00e4iden alta Galleria \/ Taidemuseo \/ Julkinen tila \/ Muu',
            'sv': 'V\u00e4lj minst en specifierande platstyp fr\u00e5n Galleri \/ Konstmuseum \/ Allm\u00e4n plats \/ Annan',
            'de': 'W\u00e4hle wenigstens einen Veranstaltungstyp unter Galerie \/ Kunstmuseum \/ \u00d6ffentlicher Raum \/ Anderer'
        },
        {
            'en': 'Please load at least one as the banner image of the event',
            'fi': 'Lataa v\u00e4hint\u00e4\u00e4 yksi kuva tapahtuman bannerikuvaksi',
            'sv': 'V\u00e4lj minst en bild som banner-bild f\u00f6r evenemanget',
            'de': 'Lade wenigstens ein Bild der Veranstaltung als Banner-Bild'
        },
        {
            'en': 'Please select a venue',
            'fi': 'Valitse paikka',
            'sv': 'V\u00e4lj plats',
            'de': 'W\u00e4hle einen Ort'
        },
        {
            'en': 'Please select the artist(s)',
            'fi': 'Valitse taiteilija(t)',
            'sv': 'V\u00e4lj konstn\u00e4r(er)',
            'de': 'W\u00e4hle einen K\u00fcnstler'
        },
        {
            'en': 'Please specify the details of your report',
            'fi': 'Ole hyv\u00e4 ja kerro mit\u00e4 raportointisi koskee',
            'sv': 'Var sn\u00e4ll och ber\u00e4tta vad din anm\u00e4lan g\u00e4ller',
            'de': 'Bitte nenne die Details deines Reports'
        },
        {
            'en': 'Printmaking',
            'fi': 'Taidegrafiikka',
            'sv': 'Konstgrafik',
            'de': 'Druckgrafik'
        },
        {
            'en': 'Privacy policy',
            'fi': 'Tietosuojak\u00e4yt\u00e4nt\u00f6',
            'sv': 'Sekretesspolicy',
            'de': 'Datenschutzbestimmungen'
        },
        {
            'en': 'Private house',
            'fi': 'Yksityisasunto',
            'sv': 'Privat l\u00e4genhet',
            'de': 'Privatwohnung'
        },
        {
            'en': 'Processing request',
            'fi': 'Pyynt\u00f6\u00e4 k\u00e4sitell\u00e4\u00e4n',
            'sv': 'Behandlar beg\u00e4ran',
            'de': 'Verarbeitungsanforderung'
        },
        {
            'en': 'Public building',
            'fi': 'Julkinen rakennus',
            'sv': 'Allm\u00e4n byggnad',
            'de': '\u00d6ffentliches Geb\u00e4ude'
        },
        {
            'en': 'Public space',
            'fi': 'Julkinen tila',
            'sv': 'Allm\u00e4n plats',
            'de': '\u00d6ffentliches Gel\u00e4nde'
        },
        {
            'en': 'Recent cities',
            'fi': 'Viimeaikaiset kaupungit',
            'sv': 'Tidigare st\u00e4der',
            'de': 'Letzte Stadt'
        },
        {
            'en': 'Report',
            'fi': 'Raportoi',
            'sv': 'Anm\u00e4l',
            'de': 'Report'
        },
        {
            'en': 'Report artist',
            'fi': 'Raportoi tapahtuma',
            'sv': 'Rapportera konstn\u00e4r',
            'de': 'Artist Melden'
        },
        {
            'en': 'Report event',
            'fi': 'Raportoi tapahtuma',
            'sv': 'Rapportera evenemang',
            'de': 'Veranstaltungs'
        },
        {
            'en': 'Report event \/ venue \/ artist',
            'fi': 'Ilmianna tapahtuma \/ paikka \/ taiteilija',
            'sv': 'Anm\u00e4l evenemang \/ plats \/ konstn\u00e4r',
            'de': 'Veranstaltungen \/ Veranstaltungsorte \/ K\u00fcnstler melden'
        },
        {
            'en': 'Report this page',
            'fi': 'Ilmianna t\u00e4m\u00e4 sivu',
            'sv': 'Anm\u00e4l denna sida',
            'de': 'Seite melden'
        },
        {
            'en': 'Report venue',
            'fi': 'Raportoi tapahtuma',
            'sv': 'Rapportera lokal',
            'de': 'Veranstaltungsort'
        },
        {
            'en': 'SAVED',
            'fi': 'TALLENNETTU',
            'sv': 'SAVED',
            'de': 'SAVED'
        },
        {
            'en': 'Sat',
            'fi': 'La',
            'sv': 'L\u00f6r',
            'de': 'Sa'
        },
        {
            'en': 'Saturday',
            'fi': 'Lauantai',
            'sv': 'L\u00f6rdag',
            'de': 'Samstag'
        },
        {
            'en': 'Save',
            'fi': 'Tallenna',
            'sv': 'Spara',
            'de': 'Speichern'
        },
        {
            'en': 'Saved searches',
            'fi': 'Tallenetut haut',
            'sv': 'Sparade s\u00f6kningar',
            'de': 'Gespeicherte Suchanfragen'
        },
        {
            'en': 'Sculpture',
            'fi': 'Kuvanveisto',
            'sv': 'Skulptur',
            'de': 'Skulptur'
        },
        {
            'en': 'Search a city',
            'fi': 'Etsi kaupunkia',
            'sv': 'S\u00f6k p\u00e5 stad',
            'de': 'Stadt ausw\u00e4hlen'
        },
        {
            'en': 'Search events, artists, genres\u2026',
            'fi': 'Etsi tapahtumia, taiteilijoita, taidelajeja',
            'sv': 'S\u00f6k evenemang, artister, konstform',
            'de': 'Suche Veranstaltungen, artist, Genres ...'
        },
        {
            'en': 'Search keyword',
            'fi': 'Etsi tapahtumia, taiteilijoita, taidelajeja',
            'sv': 'S\u00f6k evenemang, artister, konstformer',
            'de': 'Suche Veranstaltungen, K\u00fcnstler, Genres ...'
        },
        {
            'en': 'Search keywords',
            'fi': 'Hakusana',
            'sv': 'S\u00f6kord',
            'de': 'Stichw\u00f6rter suchen'
        },
        {
            'en': 'Send this to email',
            'fi': 'Jaa s\u00e4hk\u00f6postilla',
            'sv': 'Dela med e-post',
            'de': 'Als E-Mail verschicken'
        },
        {
            'en': 'Sending invitation...',
            'fi': 'L\u00e4hett\u00e4\u00e4 kutsuja...',
            'sv': 'Skickar inbjudningar...',
            'de': 'Die Einladung wird versendet...'
        },
        {
            'en': 'Sep',
            'fi': 'Syys',
            'sv': 'Sept',
            'de': 'September'
        },
        {
            'en': 'Settings',
            'fi': 'Asetukset',
            'sv': 'Inst\u00e4llningar',
            'de': 'Einstellungen'
        },
        {
            'en': 'Share',
            'fi': 'Jaa',
            'sv': 'Dela',
            'de': 'Teilen'
        },
        {
            'en': 'Share this to Facebook',
            'fi': 'Jaa Facebookissa',
            'sv': 'Dela p\u00e5 Facebook',
            'de': 'Auf Facebook teilen'
        },
        {
            'en': 'Share this to Twitter',
            'fi': 'Jaa Twitteriss\u00e4',
            'sv': 'Dela p\u00e5 Twitter',
            'de': 'Auf Twitter teilen'
        },
        {
            'en': 'Short event',
            'fi': 'Lyhyt tapahtuma',
            'sv': 'Kort evenemang',
            'de': 'Kurzes Ereignis'
        },
        {
            'en': 'Short events',
            'fi': 'Lyhyet tapahtumat',
            'sv': 'Kortta evenemang',
            'de': 'Kurze Ereignisse'
        },
        {
            'en': 'Show more',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4',
            'sv': 'Visa mer',
            'de': 'Mehr anzeigen'
        },
        {
            'en': 'Show more events',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4 tapahtumia',
            'sv': 'Visa fler evenmang',
            'de': 'Mehr Veranstaltungen anzeigen'
        },
        {
            'en': 'Show more favorites',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4 suosikkeja',
            'sv': 'Visa fler favoriter',
            'de': 'Mehr Favoriten anzeigen'
        },
        {
            'en': 'Show more venues',
            'fi': 'N\u00e4yt\u00e4 lis\u00e4\u00e4 paikkoja',
            'sv': 'visa fler lokaler',
            'de': 'Mehr Verastallungsorte anzeigen'
        },
        {
            'en': 'Show past events',
            'fi': 'N\u00e4yt\u00e4 menneet tapahtumat',
            'sv': 'Visa tidigare evenemang',
            'de': 'Vergangene Veranstaltungen anzeigen'
        },
        {
            'en': 'Sign in',
            'fi': 'Kirjaudu sis\u00e4\u00e4n',
            'sv': 'Logga in',
            'de': 'Log in'
        },
        {
            'en': 'Sign in and curate your own art scene',
            'fi': 'Kirjaudu sis\u00e4\u00e4n ja kuratoi oma sis\u00e4lt\u00f6si',
            'sv': 'Logga in och ordna din egen konstscen',
            'de': 'Log in und kuratieren Sie Ihre eigene Kunstszene'
        },
        {
            'en': 'Sign out',
            'fi': 'Kirjaudu ulos',
            'sv': 'Logga ut',
            'de': 'Abmelden'
        },
        {
            'en': 'Site specific art',
            'fi': 'Paikkasidonnainen taide',
            'sv': 'Platsspecifik konst',
            'de': 'Ortsspezifische Kunst'
        },
        {
            'en': 'Sound art',
            'fi': '\u00c4\u00e4nitaide',
            'sv': 'Ljudkonst',
            'de': 'Klangkunst'
        },
        {
            'en': 'Special time',
            'fi': 'Muut aukioloajat',
            'sv': 'Speciella tider',
            'de': 'Sonderzeiten'
        },
        {
            'en': 'Specific genre (photography, design etc)',
            'fi': 'Taiteenlajiin erikoistunut (valokuva, design jne)',
            'sv': 'Specialicerad p\u00e5 konstform (fotografi, design, etc.)',
            'de': 'Genre (Fotografie, Design etc.)'
        },
        {
            'en': 'Street',
            'fi': 'Katu',
            'sv': 'Gata',
            'de': 'Strasse'
        },
        {
            'en': 'Street art',
            'fi': 'Katutaide',
            'sv': 'Gatukonst',
            'de': 'Street Art'
        },
        {
            'en': 'Subject',
            'fi': 'Aihe',
            'sv': '\u00c4mne',
            'de': 'Inhalt\/Thema'
        },
        {
            'en': 'Suggestions',
            'fi': 'Ehdotukset',
            'sv': 'F\u00f6rslag',
            'de': 'Vorschl\u00e4ge'
        },
        {
            'en': 'Sun',
            'fi': 'Su',
            'sv': 'S\u00f6n',
            'de': 'So'
        },
        {
            'en': 'Sunday',
            'fi': 'Sunnuntai',
            'sv': 'S\u00f6ndag',
            'de': 'Sonntag'
        },
        {
            'en': 'Terms of Service and Privacy Policy',
            'fi': 'k\u00e4ytt\u00f6ehdot ja tietosuojak\u00e4yt\u00e4nn\u00f6t',
            'sv': 'villkor och v\u00e5r sekretesspolicy',
            'de': 'Servicebedingungen sowie unserer Datenschutzerkl\u00e4rung einverstanden.'
        },
        {
            'en': 'Textile art',
            'fi': 'Tekstiilitaide',
            'sv': 'Textilkonst',
            'de': 'Textilkunst'
        },
        {
            'en': 'Thurs',
            'fi': 'To',
            'sv': 'Tors',
            'de': 'Do'
        },
        {
            'en': 'Thursday',
            'fi': 'Torstai',
            'sv': 'Torsdag',
            'de': 'Donnerstag'
        },
        {
            'en': 'Title',
            'fi': 'Otsikko',
            'sv': 'Rubrik',
            'de': 'Titel'
        },
        {
            'en': 'Today',
            'fi': 'T\u00e4n\u00e4\u00e4n',
            'sv': 'Idag',
            'de': 'Heute'
        },
        {
            'en': 'Top searches',
            'fi': 'Suosituimmat haut',
            'sv': 'Popul\u00e4raste s\u00f6kningar',
            'de': 'Beliebte Suchanfragen'
        },
        {
            'en': 'Tue',
            'fi': 'Ti',
            'sv': 'Tis',
            'de': 'Di'
        },
        {
            'en': 'Tuesday',
            'fi': 'Tiistai',
            'sv': 'Tisdag',
            'de': 'Dienstag'
        },
        {
            'en': 'Type artist name',
            'fi': 'Taiteilijan nimi',
            'sv': 'Konstn\u00e4rens namn',
            'de': 'Name des K\u00fcnstlers'
        },
        {
            'en': 'Type comment',
            'fi': 'Lis\u00e4\u00e4 merkint\u00e4',
            'sv': 'Kommentera',
            'de': 'Bemerkungen'
        },
        {
            'en': 'Type one email per line',
            'fi': 'Kirjoita yksi s\u00e4hk\u00f6postiosoite per rivi',
            'sv': 'Skriv en e-post adress per rad',
            'de': 'Eine E-Mail-Adresse pro Zeile eingeben'
        },
        {
            'en': 'Type your email address below. We will send you an instruction on how to reset your password',
            'fi': 'Kirjoita s\u00e4hk\u00f6postiosoitteesi alle. L\u00e4het\u00e4mme sinulle ohjeet kuinka voit luoda itsellesi uuden salasanan.',
            'sv': 'Skriv din e-post. Vi skickar instruktioner f\u00f6r \u00e5terst\u00e4llandet av ditt l\u00f6senord.',
            'de': 'E-Mail-Adresse bitte unten eingeben. Wir werden dann weitere Anweisungen zum Zur\u00fccksetzen des Passwortes senden.'
        },
        {
            'en': 'Type your friend\'s email address below and we\'ll send them an invitation',
            'fi': 'Kirjoita yst\u00e4viesi s\u00e4hk\u00f6postiosoitteet alle niin l\u00e4het\u00e4mme heille kutsut',
            'sv': 'Skriv dina v\u00e4nners e-post adresser nedan, s\u00e5 skickar vi dem en inbjudan',
            'de': 'Gib die E-Mail Adresse eines Freundes ein, um eine Einladung zu schicken'
        },
        {
            'en': 'URL',
            'fi': 'URL',
            'sv': 'URL',
            'de': 'URL'
        },
        {
            'en': 'Use as guest',
            'fi': 'Kirjaudu vierailijana',
            'sv': 'Anv\u00e4nd som g\u00e4st',
            'de': 'als Gast benutzen'
        },
        {
            'en': 'Username successfully changed',
            'fi': 'K\u00e4ytt\u00e4j\u00e4tunnus onnistuneesti vaihdettu',
            'sv': 'Username successfully changed',
            'de': 'Username successfully changed'
        },
        {
            'en': 'Username taken',
            'fi': 'K\u00e4ytt\u00e4j\u00e4tunnus on jo olemassa',
            'sv': 'Anv\u00e4ndarnamnet finns redan',
            'de': 'Der Benutzername wird schon verwendet'
        },
        {
            'en': 'Venue',
            'fi': 'Paikka',
            'sv': 'Lokal',
            'de': 'Veranstaltungsort'
        },
        {
            'en': 'Venue address',
            'fi': 'Osoite',
            'sv': 'Adress f\u00f6r plats',
            'de': 'Adresse des Veranstaltungsortes'
        },
        {
            'en': 'Venue city',
            'fi': 'Kaupunki',
            'sv': 'Stad',
            'de': 'Stadt in der die Veranstaltung stattfindet'
        },
        {
            'en': 'Venue description',
            'fi': 'Kuvaus',
            'sv': 'Beskrivning av plats',
            'de': 'Veranstaltungsort Beschreibung'
        },
        {
            'en': 'Venue name',
            'fi': 'Nimi',
            'sv': 'Namn p\u00e5 plats',
            'de': 'Name des Veranstaltungsortes'
        },
        {
            'en': 'Venue successfully created',
            'fi': 'Paikka onnistuneesti luotu',
            'sv': 'Platsen skapad lyckat',
            'de': 'Der Veranstaltungsort wurde erfolgreich erstellt'
        },
        {
            'en': 'Venue type (museum, gallery, public space, other)',
            'fi': 'Tyyppi (museo, galleria, julkinen tila, muu)',
            'sv': 'Typ av plats (museum, galleri, allm\u00e4n plats, annan)',
            'de': 'Typ des Veranstaltungsortes'
        },
        {
            'en': 'Venues',
            'fi': 'Paikat',
            'sv': 'Lokaler',
            'de': 'Verastaltungsortes'
        },
        {
            'en': 'Video art',
            'fi': 'Videotaide',
            'sv': 'Videokonst',
            'de': 'Videokunst'
        },
        {
            'en': 'Web',
            'fi': 'Web',
            'sv': 'Webb',
            'de': 'Webseite'
        },
        {
            'en': 'Website',
            'fi': 'www-sivut',
            'sv': 'Webbsida',
            'de': 'Website'
        },
        {
            'en': 'Wed',
            'fi': 'Ke',
            'sv': 'Ons',
            'de': 'Mi'
        },
        {
            'en': 'Wednesday',
            'fi': 'Keskiviikko',
            'sv': 'Onsdag',
            'de': 'Mittwoch'
        },
        {
            'en': 'When?',
            'fi': 'Koska?',
            'sv': 'N\u00e4r',
            'de': 'Wann?'
        },
        {
            'en': 'Where?',
            'fi': 'Miss\u00e4?',
            'sv': 'Var',
            'de': 'Wo?'
        },
        {
            'en': 'Written in media',
            'fi': 'Mediassa',
            'sv': 'Skrivet om i media',
            'de': 'In Medien geschrieben'
        },
        {
            'en': 'You are now being redirected to the event page in (%%) second(s)',
            'fi': 'siirryt automaattisesti luomasi tapahtuman sivulle muutaman sekunnin kuluttua',
            'sv': 'Du flyttas automatiskt till sidan f\u00f6r evenemanget du skapat om n\u00e5gra sekunder',
            'de': 'Sie werden jetzt automatisch zur Veranstaltungsseite weitergeleitet in (%%) Sekunde(n)'
        },
        {
            'en': 'You are now being redirected to the venue page in (%%) second(s)',
            'fi': 'Siirryt automaattisesti luomasi paikan sivulle muutaman sekunnin kuluttua',
            'sv': 'Du flyttas automatiskt till sidan f\u00f6r platsen du skapat om n\u00e5gra sekunder',
            'de': 'Sie werden jetzt automatisch zur Veranstaltungsseite weitergeleitet in (%%) Sekunde(n)'
        },
        {
            'en': 'Your email address',
            'fi': 'S\u00e4hk\u00f6postiosoitteesi',
            'sv': 'Din e-postadress',
            'de': 'E-Mail-Adresse eingeben'
        },
        {
            'en': 'Your invitation has been sent. Thank you',
            'fi': 'Kutsusi on nyt l\u00e4hetetty. Kiitos!',
            'sv': 'Dina inbjudningar har skickats. Tack!',
            'de': 'Die Einladung wurde gesendet. Danke!'
        },
        {
            'en': 'Your previous saved searches',
            'fi': 'Aiemmat tallennetut haut',
            'sv': 'Dina tidiagre sparade s\u00f6kningar',
            'de': 'Gespeicherte, fr\u00fchere Suchen'
        },
        {
            'en': 'Your previous searches',
            'fi': 'Viimeaikaiset haut',
            'sv': 'Dina tidigare s\u00f6kningar',
            'de': 'Ihre vorherigen Suchanfragen'
        },
        {
            'en': 'admission fee',
            'fi': 'Sis\u00e4\u00e4np\u00e4\u00e4symaksu',
            'sv': 'Intr\u00e4desavgift',
            'de': 'Aufnahmegeb\u00fchr'
        },
        {
            'en': 'always open',
            'fi': 'always open',
            'sv': 'always open',
            'de': 'always open'
        },
        {
            'en': 'and curate your own art scene',
            'fi': 'ja j\u00e4rjest\u00e4 oma taidekokoelmasi',
            'sv': 'och ordna din egen konstscen',
            'de': 'und kuratieren Sie Ihre eigene Kunstszene'
        },
        {
            'en': 'art genre(s)',
            'fi': 'Taidelajit',
            'sv': 'Konstgenre',
            'de': 'Repr\u00e4sentiertes Kunstgenre'
        },
        {
            'en': 'art genre(s) represented',
            'fi': 'Edustetut taidelajit',
            'sv': 'Konstgenre',
            'de': 'Kunstgenre'
        },
        {
            'en': 'art lover',
            'fi': 'Taiteen yst\u00e4v\u00e4',
            'sv': 'Konstv\u00e4n',
            'de': 'Kunstfreund'
        },
        {
            'en': 'artist',
            'fi': 'Taiteilijja',
            'sv': 'Konstn\u00e4r',
            'de': 'K\u00fcnstler'
        },
        {
            'en': 'artist(s)',
            'fi': 'Taiteilija(t)',
            'sv': 'Konstn\u00e4r\/konstn\u00e4rer',
            'de': 'Artist'
        },
        {
            'en': 'cancel',
            'fi': 'Peru',
            'sv': 'Avsluta',
            'de': 'L\u00f6schen'
        },
        {
            'en': 'ceramic art',
            'fi': 'keramiikka',
            'sv': 'keramik',
            'de': 'keramik-kunst'
        },
        {
            'en': 'collage',
            'fi': 'kollaasi',
            'sv': 'kollage',
            'de': 'collage'
        },
        {
            'en': 'comics',
            'fi': 'sarjakuvataide',
            'sv': 'seriekonst',
            'de': 'comics'
        },
        {
            'en': 'dates',
            'fi': 'P\u00e4iv\u00e4m\u00e4\u00e4r\u00e4',
            'sv': 'Datum',
            'de': 'Datum'
        },
        {
            'en': 'digital art',
            'fi': 'digitaalinen taide',
            'sv': 'digital konst',
            'de': 'digital art'
        },
        {
            'en': 'drawing',
            'fi': 'piirrustus',
            'sv': 'teckning',
            'de': 'zeichnung'
        },
        {
            'en': 'e-mail',
            'fi': 's\u00e4hk\u00f6posti',
            'sv': 'E-post',
            'de': 'E-Mail'
        },
        {
            'en': 'event description',
            'fi': 'Tapahtuman kuvaus',
            'sv': 'Beskrivning av evenemang',
            'de': 'Veranstaltungsbeschreibung'
        },
        {
            'en': 'event name',
            'fi': 'Tapahtuman nimi',
            'sv': 'Namn p\u00e5 evenemang',
            'de': 'Name des Veranstaltung'
        },
        {
            'en': 'event organizer (eg gallery, museum, art festval)',
            'fi': 'Tapahtumaj\u00e4rjest\u00e4j\u00e4 (esim. galleria, museo, taidefestivaali)',
            'sv': 'Arrang\u00f6r (t.ex. galleri, museum, konstfestival)',
            'de': 'Organisator (z.B. Galerie, Museum, Kunstfestival)'
        },
        {
            'en': 'film',
            'fi': 'elokuva',
            'sv': 'film',
            'de': 'film'
        },
        {
            'en': 'first name',
            'fi': 'Etunimi',
            'sv': 'F\u00f6rnamn',
            'de': 'Vorname'
        },
        {
            'en': 'free admission',
            'fi': 'Ilmainen',
            'sv': 'Fri entr\u00e9',
            'de': 'Freier Eintritt'
        },
        {
            'en': 'games',
            'fi': 'pelit',
            'sv': 'spel',
            'de': 'spiele'
        },
        {
            'en': 'glass art',
            'fi': 'lasitaide',
            'sv': 'glaskonst',
            'de': 'glaskunst'
        },
        {
            'en': 'illustration',
            'fi': 'kuvitus',
            'sv': 'illustration',
            'de': 'illustration'
        },
        {
            'en': 'installation art',
            'fi': 'installaatiotaide',
            'sv': 'installationskonst',
            'de': 'installationskunst'
        },
        {
            'en': 'land art',
            'fi': 'maataide',
            'sv': 'jordkonst',
            'de': 'land-art'
        },
        {
            'en': 'last chance',
            'fi': 'Viel\u00e4 ehdit',
            'sv': 'Sista chansen',
            'de': 'Letzte Chance'
        },
        {
            'en': 'last name',
            'fi': 'Sukunimi',
            'sv': 'Efternamn',
            'de': 'Nachname'
        },
        {
            'en': 'latest events',
            'fi': 'Uusimmat tapahtumat',
            'sv': 'Senaste evenemang',
            'de': 'Neuste Veranstaltungen'
        },
        {
            'en': 'light art',
            'fi': 'valotaide',
            'sv': 'light art',
            'de': 'light art'
        },
        {
            'en': 'load images',
            'fi': 'Lataa kuvia',
            'sv': 'Ladda bilder',
            'de': 'Bilder laden'
        },
        {
            'en': 'media art',
            'fi': 'mediataide',
            'sv': 'mediekonst',
            'de': 'medienkunst'
        },
        {
            'en': 'museum',
            'fi': 'Museo',
            'sv': 'Museum',
            'de': 'Museum'
        },
        {
            'en': 'opening hours',
            'fi': 'Aukioloajat',
            'sv': '\u00d6ppettider',
            'de': '\u00d6ffungzeiten'
        },
        {
            'en': 'other',
            'fi': 'muut',
            'sv': 'annat',
            'de': 'sonstige'
        },
        {
            'en': 'painting',
            'fi': 'maalaustaide',
            'sv': 'm\u00e5leri',
            'de': 'malerei'
        },
        {
            'en': 'password',
            'fi': 'Salasana',
            'sv': 'L\u00f6senord',
            'de': 'Passwort'
        },
        {
            'en': 'password again',
            'fi': 'Salasana uudelleen',
            'sv': 'Skriv in l\u00f6senordet igen',
            'de': 'Passwort erneut eingeben'
        },
        {
            'en': 'performance art',
            'fi': 'performanssitaide',
            'sv': 'performanskonst',
            'de': 'performance-kunst'
        },
        {
            'en': 'phone number',
            'fi': 'Puhelin',
            'sv': 'Telefonnummer',
            'de': 'Telefonnummer'
        },
        {
            'en': 'photography',
            'fi': 'valokuvataide',
            'sv': 'fotografi',
            'de': 'fotografie'
        },
        {
            'en': 'popular',
            'fi': 'Suosittu',
            'sv': 'Popul\u00e4rt',
            'de': 'Beliebt'
        },
        {
            'en': 'printmaking',
            'fi': 'taidegrafiikka',
            'sv': 'konstgrafik',
            'de': 'druckgrafik'
        },
        {
            'en': 'profile type',
            'fi': 'Profiilityyppi',
            'sv': 'Profiltyp',
            'de': 'Profiltyp'
        },
        {
            'en': 'public space',
            'fi': 'Julkinen tila',
            'sv': 'Allm\u00e4n plats',
            'de': '\u00d6ffentliches Gel\u00e4nde'
        },
        {
            'en': 'same as above but with already existing information',
            'fi': 'same as above but with already existing information',
            'sv': 'same as above but with already existing information',
            'de': 'same as above but with already existing information'
        },
        {
            'en': 'sculpture',
            'fi': 'kuvanveisto',
            'sv': 'skulptur',
            'de': 'skulptur'
        },
        {
            'en': 'search a city',
            'fi': 'Etsi kaupunkia',
            'sv': 'S\u00f6k p\u00e5 stad',
            'de': 'Stadt ausw\u00e4hlen'
        },
        {
            'en': 'search events, artists, genres\u2026',
            'fi': 'Etsi tapahtumia, taiteilijoita, taidelajeja',
            'sv': 'S\u00f6k evenemang, artister, genrer',
            'de': 'Suche Veranstaltungen, artist, Genres ...'
        },
        {
            'en': 'see text content on separate doc',
            'fi': 'see text content on separate doc',
            'sv': 'see text content on separate doc',
            'de': 'see text content on separate doc'
        },
        {
            'en': 'site specific art',
            'fi': 'paikkasidonnainen taide',
            'sv': 'platsspecifik konst',
            'de': 'ortsspezifische kunst'
        },
        {
            'en': 'sound art',
            'fi': '\u00e4\u00e4nitaide',
            'sv': 'sound art',
            'de': 'sound art'
        },
        {
            'en': 'street art',
            'fi': 'katutaide',
            'sv': 'gatukonst',
            'de': 'street art'
        },
        {
            'en': 'textile art',
            'fi': 'tekstiilitaide',
            'sv': 'textilkonst',
            'de': 'textilkunst'
        },
        {
            'en': 'venue',
            'fi': 'Paikka',
            'sv': 'Lokal',
            'de': 'Veranstaltungsort'
        },
        {
            'en': 'venue address',
            'fi': 'Osoite',
            'sv': 'Adress f\u00f6r lokal',
            'de': 'Veranstaltungsort adresse'
        },
        {
            'en': 'venue description',
            'fi': 'Kuvaus',
            'sv': 'Beskrivning av lokal',
            'de': 'Veranstaltungsort Beschreibung'
        },
        {
            'en': 'venue name',
            'fi': 'Nimi',
            'sv': 'Namn p\u00e5 lokal',
            'de': 'Veranstaltungsort name'
        },
        {
            'en': 'venue type (museum, gallery, public space, other)',
            'fi': 'Tyyppi',
            'sv': 'Typ av lokal (museum, galleri, allm\u00e4n plats, annan)',
            'de': 'Veranstaltungsort typ'
        },
        {
            'en': 'video art',
            'fi': 'videotaide',
            'sv': 'videokonst',
            'de': 'videokunst'
        },
        {
            'en': 'website',
            'fi': 'www-sivut',
            'sv': 'Webbsida',
            'de': 'Website'
        },
        {
            'en': 'written in media',
            'fi': 'Mediassa',
            'sv': 'Skrivet om i media',
            'de': 'in Medien geschrieben'
        },


        {
            'en': 'Page not found',
            'fi': 'Sivua ei löydetty',
            'sv': 'Sidan hittas inte',
            'de': 'Seite nicht gefunden'
        },
        {
            'en': 'The page you are looking for does not exist or may have been removed',
            'fi': 'Sivu etsit ei ole olemassa tai se on poistettu',
            'sv': 'Sidan du söker finns inte eller kan ha tagits bort',
            'de': 'Die Seite, die Sie suchen existiert nicht oder wurde möglicherweise entfernt'
        },
        {
            'en': 'Continue to home page',
            'fi': 'Jatka kotisivu',
            'sv': 'Fortsätt till startsidan',
            'de': 'Weiter zur Homepage'
        },
        {
            'en': 'Network error',
            'fi': 'Verkkovirhe',
            'sv': 'Netverksfel',
            'de': 'Netzwerkfehler'
        },
        {
            'en': 'No location available',
            'fi': 'Sijaintia ei ole saatavilla',
            'sv': 'Ingen plats tillgänglig',
            'de': 'Kein Standort verfügbar'
        },
        {
            'en': 'No events',
            'fi': 'Ei tapahtumia',
            'sv': 'Inga evenemang',
            'de': 'Keine Veranstaltungen'
        }
    ];

    var lastLength = translations.length,
        refresh = function() {
        // Reset length
        translations.length = lastLength;
        // Return
        return API.get('location/translations', {
            model: 'city'
        }).then(function(response) {
            // Append
            (response.data || []).forEach(function(translation) {
                // Append
                translations.push(translation);
            });
            return response.data || [];
        });
    };

    refresh();

    $rootScope.$on('updateTranslation', refresh);
    $rootScope.$on('updateCities', refresh);

    // Return
    return translations;
}]);

'use strict';

/**
 * Link
 */
angular.module('main').filter('link', [function() {

  return function(input) {

    if (!input) {
      return input;
    }

    var prefix = 'http';

    // Convert url as link
    if (input.toLowerCase().substr(0, prefix.length) !== prefix) {
      // Prepend prefix
      input = prefix + '://' + input;
    }
    // Return
    return input;
  };
}]);
'use strict';

// Language filter
angular.module('main').filter('lang', langFilter);

langFilter.$inject = ['translations', 'LangSvc'];

function langFilter(translations, LangSvc) {

  // Args char
  var argsChar = '%%';

  var replaceArgs = function(str, args) {
    // Counter
    var c = 0;
    // Find
    while (true) {
      // If found
      var pos = str.indexOf(argsChar);
      // If there's any
      if (pos >= 0 && (typeof args[c] !== 'undefined')) {
        // Replace
        str = str.replace(argsChar, args[c]);
        // Increment
        c++;
      } else {
        // Quit
        break;
      }
    }
    // Return
    return str;
  };

  var translate = function(input, args, lang, key) {
    var userLang = LangSvc.getLanguage();

    lang = lang || 'en';

    // Fix
    if (userLang === 'se') {
      userLang = 'sv';
    }

    // If no input
    if (!input) {
      return '';
    }
    
    // If input has | and 4
    var trans = input.split('|');
    // If 4
    if (trans.length === 4) {
      // Use it
      var langs = { en: 0, fi: 1, sv: 2, de: 3 };
      // Return
      return replaceArgs(trans[langs[userLang]], args);
    }

    // If already english
    if (userLang === lang) {
      // Return
      return replaceArgs(input, args);
    }

    // Clean
    var clean = angular.element.trim(input.toLowerCase());
    // Loop through translations
    for (var i = 0; i < translations.length; i++) {
      // If match
      if (translations[i][lang].toLowerCase() === clean) {
        // Rturn
        return replaceArgs(translations[i][userLang], args);
      }
    }

    // Return original
    return replaceArgs(input, args);
  };

	// Find the english text
  return translate;
}

'use strict';

/**
 * Money filter
 */

angular.module('main').filter('money', [function() {
  // Set euro
  var euro = '€';

  return function(input) {
    // If nothing
    if (!input) {
      // Set as free
      input = 'Free';
    }
    // Return
    return input;

    /*
    // Check first character
    if (input.charAt(0) === euro || input.toLowerCase() === 'free') {
      // Return
      return input;
    }
    // Just prepend euro
    return euro + ' ' + input;
    */
  };
}]);
'use strict';

/**
 * Time filter
 */
angular.module('main').filter('time', [function() {

  // Return
  return function(input) {

    if (!input) {
      return '';
    }

    while (input.length < 4) {
      input = '0' + input;
    }

    //if (input.length === 4) {
      return input.substr(0, 2) + ':' + input.substr(2);
    //} else {
    //  return input;
    //}
  };
}]);
'use strict';

/**
 * Distance filter
 */

angular.module('main').filter('distance', ['location', function(location) {
  // Return
  return function(input) {
    // Get distance
    var distance = location.distance(input);
    // Return
    return location.format(distance);
  };
}]);
'use strict';

angular.module('main').filter('openinghours', ['moment', '$window', '$filter', function(moment, $window, $filter) {

  return function(input) {
    
    // If openByAppointment
    if (input && input.openByAppointment) {
      return 'Open by appointment only';
    }

    if (input && input.openingHours) {
      input = input.openingHours;
    }

    // If there's nothing
    if (!input || !input.length) {
      // Return nothing
      return '';
    }

    // Get current date
    var current = moment();
    // Current day
    var day = current.isoWeekday() - 1;

    // Days
    var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    var openingHours = {};

    var combineHours = function(start, end) {
      // Convert to int
      start = parseInt(start);
      end = parseInt(end);
      // Has minutes
      var hasMins = (start % 100) || (end % 100);
      // If there are minutes
      if (hasMins) {
        // Use full hour format
        return $filter('time')(start + '') + ' - ' + $filter('time')(end + '');
      } else {
        // Use short hour
        return (start / 100) + ' - ' + (end / 100);
      }
    };

    // Loop
    for (var i in input) {
      // Get weekday
      var weekday = weekdays[input[i].day];
      // If not set
      if (typeof openingHours[weekday] === 'undefined') {
        // Set it
        openingHours[weekday] = {
          day: weekday,
          ranges: []
        };
      }
      // If there are hours
      if (input[i].hours) {
        // Loop through hours
        for (var j in input[i].hours) {
          // Get range
          var range = input[i].hours[j];
          // If there's no start or end
          if (!range.start || !range.end) {
            // Skip
            continue;
          }
          // Push
          openingHours[weekday].ranges.push(combineHours(range.start, range.end));
        }
      }
    }

    var getLabel = function(ranges) {
      // Return
      return ranges.length ? ranges.join(', ') : 'closed';
    };

    // Week order
    var weekOrder = [];
    // Loop
    for (var k in weekdays) {
      var wkday = openingHours[weekdays[k]];
      // Set schedule
      wkday.schedule = getLabel(wkday.ranges);
      weekOrder.push(wkday);
    }

    var finalDays = [], startDay = weekOrder[0], endDay = weekOrder[0];

    var combineRange = function() {
      if (startDay.day !== endDay.day) {
        // Multiple
        return startDay.day.substr(0, 3) + ' - ' + endDay.day.substr(0, 3) + ' ' + startDay.schedule;
      } else {
        // Return single
        return startDay.day + 's ' + startDay.schedule;
      }
    };

    // Loop through order
    for (var l = 1; l < weekOrder.length; l++) {
      // This day
      var thisDay = weekOrder[l];
      // If this day doesn't match start day
      if (thisDay.schedule !== startDay.schedule) {
        // Combine
        finalDays.push(combineRange());
        // Set this day as start
        startDay = thisDay;
      }
      // Set end
      endDay = thisDay;
      if (l === weekOrder.length - 1) {
        // Push
        finalDays.push(combineRange());
      }
    }
    // Return
    return finalDays.join(', ');
  };

}]);
'use strict';

angular.module('main').filter('openstatus', ['moment', '$window', '$filter', function(moment, $window, $filter) {

  return function(input) {

    if (input && input.openByAppointment) {
      // Return
      return 'Open by appointment only';
    }

    var combineRange = function(start, end) {
      // Convert to int
      start = parseInt(start);
      end = parseInt(end);
      // Has minutes
      var hasMins = true; //(start % 100) || (end % 100);

      // If there are minutes
      //if (hasMins) {
        // Use full hour format
      var result = $filter('time')(start + '') + ' to ' + $filter('time')(end + '');
      //} else {
        // Use short hour
      //  result = (start / 100) + ' to ' + (end / 100);
      //}
      
      // Return
      return result;
    };

    var combineHours = function(hours) {
      // All
      var allHours = [];
      // Loop through ours
      for (var k in hours) {
        // If there's no range
        if (!hours[k].start || !hours[k].end) {
          // Skip
          continue;
        }
        // Push
        allHours.push('from ' + combineRange(hours[k].start, hours[k].end));
      }
      var label = '';
      // Loop through all hours
      for (var l in allHours) {
        l = parseInt(l);
        if (l > 0) {
          // Append
          label += ((allHours.length > 2) ? ', ' : ' ');
          // If last
          if (l === allHours.length - 1) {
            label += 'and ';
          }
        }
        label += allHours[l];
      }
      // Return
      return label;
    };

    // Get today
    var today = moment(), weekday = today.isoWeekday() - 1;
    // Check for special hours
    // If there are special hours
    if (input.specialHours) {
      for (var i in input.specialHours) {
        // Get specialHour
        var specialHour = input.specialHours[i];
        // If there's nothing
        if (!specialHour.startHour || !specialHour.endHour) {
          // Skip
          continue;
        }
        // Get date
        if (moment(specialHour.date, 'DD.MM.YYYY').format('YYYYMMDD') === today.format('YYYYMMDD')) {
          // Check for opens
          return 'Open today on special hours from ' + combineRange(specialHour.startHour, specialHour.endHour);
        }
      }
    }
    // Check for opening hours
    if (input.openingHours) {
      for (var j in input.openingHours) {
        // Get
        var openingHour = input.openingHours[j];
        // If day matches
        if (openingHour.day === weekday) {
          // Combine
          var combine = combineHours(openingHour.hours);
          // If there's nothing, skip
          if (!combine) {
            continue;
          }
          // There's match
          return 'Open today ' + combine;
        }
      }
    }
    // Closed
    return 'Closed today';
  };
}]);
'use strict';

/**
 * Escape string
 */

angular.module('main').filter('escape', [function() {
  // Addslashes
  var addslashes = function(str) {
    //  discuss at: http://phpjs.org/functions/addslashes/
    // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // improved by: Ates Goral (http://magnetiq.com)
    // improved by: marrtins
    // improved by: Nate
    // improved by: Onno Marsman
    // improved by: Brett Zamir (http://brett-zamir.me)
    // improved by: Oskar Larsson Högfeldt (http://oskar-lh.name/)
    //    input by: Denny Wardhana
    //   example 1: addslashes("kevin's birthday");
    //   returns 1: "kevin\\'s birthday"
    return (str + '')
      .replace(/[\\"']/g, '\\$&')
      .replace(/\u0000/g, '\\0');
  };
  // Return the escaped string
  return function(input) {
    // Escape
    return addslashes(input);
  };
}]);
'use strict';

// Plain to HTML filter
angular.module('main').filter('plainToHtml', ['$sce', function($sce) {
  // Return function
  return function(input) {
    // If not set
    if (!input) return '';
    // Html
    var arrHtml = [];
    // Split by lines
    var lines = input.split('\n');
    // Loop through lines
    for (var i in lines) {
      // Trim first
      var line = lines[i].trim();
      // If there's any
      if (line) {
        // Replace
        line = line.replace(/(http|ftp|https):\/\/([\w\-_]+(?:(?:\.[\w\-_]+)+))([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g, function(e) {
          // Find first ://
          var find = e.indexOf('://');
          return '<a href="'+e+'" target="_blank">'+e.substr(find+3)+'</a>';
        });
        // Push to arrHtml
        arrHtml.push(line);
      } else {
        arrHtml.push('');
      }
    }
    // Return
    return $sce.trustAsHtml('<p>' + arrHtml.join('<br />') + '</p>');
  };
}]);
'use strict';

angular.module('main').filter('break', ['$sce', function($sce) {
  // Return function
  return function(input, at) {
    // If there's no at
    if (typeof at === 'undefined') {
      at = 1;
    }
    // Split by spaces
    var spaces = input.split(' ');
    // Pre
    var pre = [], post = [];
    // Loop through spaces
    for (var i = 0; i < at; i++) {
      pre.push(spaces[i]);
    }
    for (var j = at; j < spaces.length; j++) {
      post.push(spaces[j]);
    }
    // Result
    var result = pre.join(' ');
    // If there's post
    if (post.length) {
      result += '<br />' + post.join(' ');
    }
    // Return
    return $sce.trustAsHtml(result);
  };
}]);
'use strict';

/**
 * Convert image source to thumb
 */
angular.module('main').filter('thumb', [function() {

  return function(input, size) {
    // If there's no input
    if (!input) {
        // Exit
        return input;
    }
    // Default size is 100
    size = (size || 100) + '';
    // Split by /
    var arrSource = input.split('/');

    // If first is "images"
    if (arrSource[0] === 'images') {
        // Prepend with uploads
        arrSource = ['', 'uploads'].concat(arrSource);
    } else if (!arrSource[0] && arrSource[1] === 'images') {
        // Insert
        arrSource.splice(1, 0, 'uploads');
    }

    // Splice
    arrSource.splice(arrSource.length - 1, 0, 'thumbs', size);
    // Join
    var thumb = arrSource.join('/');
    // Insert thumbs and size
    return thumb;
  };
}]);
'use strict';

/**
 * Touch class using HammerJS
 */

function Touch(options) {

  var flicked = false;

  // Get gallery width
  var gallery = {
    elem: null,
    init: function(elem) {
      // Set elem
      this.elem = elem;
      // Calculate
      gallery.galleryWidth = this.elem.parent().width();
      gallery.width = gallery.getWidth(this.elem);
      gallery.maxWidth = gallery.width - gallery.galleryWidth;
    },
    getWidth: function() {
      var totalWidth = 0;
      this.elem.find('li').each(function() {
        var li = angular.element(this);
        totalWidth += parseInt(li.width()) + parseInt(li.css('margin-right'));
      });
      return totalWidth;
    },
    galleryWidth: 0,
    width: 0,
    maxWidth: 0
  };

  this.drag = {
    elem: null,
    initial: 0,
    start: function(event) {
      if (flicked) {
        return false;
      }
      this.elem = angular.element(event.target).parents('ul:first');

      angular.element(this.elem).parents('.gallery:first').addClass('drag');

      // Initialize
      gallery.init(this.elem);

      this.elem.stop();
      this.initial = parseInt(this.elem.css('margin-left'));
    },
    on: function(event) {
      if (flicked) {
        return false;
      }
      // Set new margin
      var marginLeft = parseInt(this.initial + event.gesture.deltaX);
      // If exceed
      if (marginLeft >= 26) {
        return false;
      }
      // If less than least
      if (Math.abs(marginLeft) > gallery.maxWidth + 20) {
        return false;
      }
      this.elem.css('margin-left', marginLeft + 'px');
    },
    end: function(event) {
      if (flicked) {
        return false;
      }

      angular.element(this.elem).parents('.gallery:first').removeClass('drag');

      // Parse margin left
      var marginLeft = parseInt(this.elem.css('margin-left'));
      if (marginLeft > 0) {
        // Reduce to 0
        this.elem.animate({
          marginLeft: '0px'
        }, 200);
      }
      // If less than least
      if (Math.abs(marginLeft) > gallery.maxWidth) {
        // Reduce to max
        this.elem.animate({
          marginLeft: '-' + (gallery.maxWidth - 10) + 'px'
        }, 200);
      }
    }
  };

  // Flick
  this.flick = function(event, direction) {
    flicked = true;
    // Set flick speed
    var flickSpeed = 800;
    // On flick animate
    // Get ul
    var ul = angular.element(event.target).parents('ul:first');
    // Initialize ul
    gallery.init(ul);
    
    if (gallery.width < gallery.galleryWidth) {
      // Return
      return false;
    }
    // Get current margin
    var currentLeft = parseInt(ul.css('margin-left'));
    // Calculate new margin
    var marginLeft = currentLeft + (direction * event.gesture.velocityX * 200);
    // Limit margin
    if (marginLeft > 0) {
      marginLeft = 0;
    }
    if (Math.abs(marginLeft) > gallery.maxWidth) {
      marginLeft = (gallery.maxWidth - 10) * -1;
    }

    // Animate
    ul.animate({
      marginLeft: marginLeft + 'px'
    }, flickSpeed, 'easeOutQuint');
    // Regardless of finishing or not finishing flick, it should reset flicked
    setTimeout(function() {
      flicked = false;
    }, flickSpeed);
  };

}
'use strict';

/**
 * Gmap
 * @author Ronald Borla
 */

// Calendar directive
angular.module('main').directive('gmap', ['uiGmapGoogleMapApi', '$timeout', function(uiGmapGoogleMapApi, $timeout) {

  // Set map
  var _this = this, map = null;

  // Responsive
  var responsive = false, responsiveCenter = {};

  /**
   * Link
   */
  var link = function($scope, $element) {

    // Wait for google maps to initialize
    uiGmapGoogleMapApi.then(function(maps) {
      // Set options
      var options = angular.element.extend({}, $scope.options);

      // If there's latitude and longitude
      if ($scope.latitude && $scope.longitude) {
        // Set to options
        options.center = new maps.LatLng($scope.latitude, $scope.longitude);
      }
      // If there's zoom
      if ($scope.zoom) {
        // Set zoom
        options.zoom = $scope.zoom;
      }
      // Set responsive
      if ($scope.responsive) {
        responsive = $scope.responsive ? true : false;
      }

      // Initialize map
      map = new maps.Map($element.find('div:first')[0], options);

      // Add listener
      maps.event.addListener(map, 'center_changed', function() {
        // If there's change
        if ($scope.change) {
          // Call change
          $scope.change(map);
        }
        /**
         * I don't know why, but this fixes the binding
         */
        $timeout(function() {
          // Get center
          var center = map.getCenter();
          // Set it
          $scope.latitude = center.lat();
          $scope.longitude = center.lng();
          $scope.zoom = map.getZoom();
        }, 1);
      });

      // If responsive
      if (responsive) {

        // Set listener
        maps.event.addDomListener(window, 'resize', function() {
          // Set currentCenter
          map.setCenter(responsiveCenter);
        });
        maps.event.addListener(map, 'idle', function() {
          // Set center
          responsiveCenter = map.getCenter();
        });

      }

      // Loaded
      maps.event.addListener(map, 'tilesloaded', function() {
        // Call loaded
        if ($scope.loaded) {
          // Call loaded
          $scope.loaded(map);
        }
      });

      // If there's init
      if ($scope.init) {
        // Call init
        $scope.init(maps, map);
      }
    });

  };

  // Return directive
  return {
    link: link,
    scope: {
      options: '=',
      latitude: '=',
      longitude: '=',
      zoom: '=',
      init: '=',
      loaded: '=',
      change: '=',
      responsive: '@'
    },
    restrict: 'E',
    template: '<div></div>'
  };
}]);
'use strict';

// Map options service for token
angular.module('main').factory('MapOptions', [function() {
  // Return
  return {
    disableDefaultUI: true,
    styles: [
        {
            'featureType': 'all',
            'elementType': 'labels.text.fill',
            'stylers': [
                {
                    'saturation': 36
                },
                {
                    'color': '#000000'
                },
                {
                    'lightness': 40
                }
            ]
        },
        {
            'featureType': 'all',
            'elementType': 'labels.text.stroke',
            'stylers': [
                {
                    'visibility': 'on'
                },
                {
                    'color': '#000000'
                },
                {
                    'lightness': 16
                }
            ]
        },
        {
            'featureType': 'all',
            'elementType': 'labels.icon',
            'stylers': [
                {
                    'visibility': 'off'
                }
            ]
        },
        {
            'featureType': 'administrative',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 20
                }
            ]
        },
        {
            'featureType': 'administrative',
            'elementType': 'geometry.stroke',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 17
                },
                {
                    'weight': 1.2
                }
            ]
        },
        {
            'featureType': 'landscape',
            'elementType': 'geometry',
            'stylers': [
                {
                    'lightness': 20
                }
            ]
        },
        {
            'featureType': 'landscape',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#161616'
                }
            ]
        },
        {
            'featureType': 'poi',
            'elementType': 'geometry',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 21
                }
            ]
        },
        {
            'featureType': 'road.highway',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 17
                }
            ]
        },
        {
            'featureType': 'road.highway',
            'elementType': 'geometry.stroke',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 29
                },
                {
                    'weight': 0.2
                }
            ]
        },
        {
            'featureType': 'road.arterial',
            'elementType': 'geometry',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 18
                }
            ]
        },
        {
            'featureType': 'road.local',
            'elementType': 'geometry',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 16
                }
            ]
        },
        {
            'featureType': 'transit',
            'elementType': 'geometry',
            'stylers': [
                {
                    'color': '#000000'
                },
                {
                    'lightness': 19
                }
            ]
        },
        {
            'featureType': 'water',
            'elementType': 'geometry',
            'stylers': [
                {
                    'color': '#0f252e'
                },
                {
                    'lightness': 17
                }
            ]
        },
        {
            'featureType': 'water',
            'elementType': 'geometry.fill',
            'stylers': [
                {
                    'color': '#000000'
                }
            ]
        }
      ]
  };
}]);

'use strict';

// API Service
angular.module('main').service('MapResponsive', ['uiGmapGoogleMapApi', '$timeout', function(uiGmapGoogleMapApi, $timeout) {

  var controls = {};
  var _this = this;

  var getControl = function(name) {
    // If non existent
    if (!controls[name]) {
      // Declare
      controls[name] = {
        currentCenter: {},
        control: {}
      };
    }
    return controls[name];
  };

  this.setCenter = function(name, center) {
    // Get control
    var control = getControl(name);

    control.currentCenter.latitude = center.latitude;
    control.currentCenter.longitude = center.longitude;

    return _this;
  };

  this.initialize = function(name, control) {
    // Get control
    var _control = getControl(name);
    // Set control
    _control.control = control;
    // Wait for maps to initialize
    uiGmapGoogleMapApi.then(function(maps) {
      // Delay
      $timeout(function() {
        // Get map
        var map = _control.control.getGMap();
        // Set listener
        maps.event.addDomListener(window, 'resize', function() {
          // Set currentCenter
          if (_control.currentCenter.latitude && _control.currentCenter.longitude) {
            map.setCenter(new maps.LatLng(_control.currentCenter.latitude, _control.currentCenter.longitude));
          }
        });
        maps.event.addListener(map, 'idle', function() {
          // Set currentCenter
          _this.setCenter(name, {
            latitude: map.getCenter().lat(),
            longitude: map.getCenter().lng()
          });
        });
      }, 1000);
    });
    return _this;
  };

}]);
'use strict';

/**
 * Modal view
 * @author Ronald Borla
 */

// Modal directive
angular.module('main').directive('modal', ['$timeout', '$window', function($timeout, $window) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {

    $scope.items = [];
    $scope.item = {};
    $scope.index = $scope.index || 'id';

    var findActiveItem = function() {
      if ($scope.items && $scope.items.length > 0) {
        for (var i in $scope.items) {
          // If found
          if ($scope.items[i][$scope.index] === $scope.active) {
            // Return index
            return i;
          }
        }
      }
      return -1;
    };

    var adjustModalPosition = function() {
      // Get wrap
      var wrap = $element.find('.wrap:first');
      // Get window and wrap height
      var winHeight = angular.element($window).height(),
          wrapHeight = wrap.height();
      // Set top
      wrap.css('top', ((winHeight / 2) - (wrapHeight / 2)) + 'px');
    };

    // Preview
    var preview = function() {
      // Find
      var index = findActiveItem();
      // Set item
      $scope.item = (index >= 0) ? $scope.items[index] : {};
      // Adjust wrap
      adjustModalPosition();
    };

    $scope.previous = function() {
      // Set item
      var index = findActiveItem();
      // If there's any
      if (index >= 0) {
        // Subtract
        index--;
        if (index < 0) {
          index = 0;
        }
        $scope.active = $scope.items[index][$scope.index];
      } else {
        $scope.active = null;
      }
    };

    $scope.next = function() {
      // Set item
      var index = findActiveItem();
      // If there's any
      if (index >= 0) {
        // Subtract
        index++;
        if (index >= $scope.items.length) {
          index = $scope.items.length - 1;
        }
        $scope.active = $scope.items[index][$scope.index];
      } else {
        $scope.active = null;
      }
    };

    $scope.close = function() {
      // Inactive
      $scope.active = null;
    };

    var body = angular.element('body:first');
    var prevBodyOverflow = body.css('overflow');

    // Watch active
    $scope.$watch('active', function(now, prev) {
      if (now !== prev) {
        // Get now
        if ($scope.active !== null) {
          // Set body
          body.css({ overflow: 'hidden' });
          // Preview
          preview();
        } else {
          // Remove 
          body.css({ overflow: prevBodyOverflow });
        }
      }
    });

    angular.element($window).on('resize', function() {
      adjustModalPosition();
    });

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };

  // Return directive
  return {
    link: link,
    scope: {
      items: '=',
      index: '=',
      active: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);
'use strict';

/**
 * Share
 * @author Ronald Borla
 */

// Modal directive
angular.module('main').directive('share', ['$timeout', '$window', '$state', function($timeout, $window, $state) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {

    $scope.target = $state.href($state.current.name, $state.params, { absolute: true });

    $scope.close = function() {
      // Close
      $scope.active = false;
    };

    var adjustModalPosition = function() {
      // Get wrap
      var wrap = $element.find('.wrap:first');
      // Get window and wrap height
      var winHeight = angular.element($window).height(),
          wrapHeight = wrap.height();
      // Set top
      wrap.css('top', ((winHeight / 2) - (wrapHeight / 2)) + 'px');
    };

    var body = angular.element('body:first');
    var prevBodyOverflow = body.css('overflow');

    $scope.$watch('active', function(current, prev) {
      if (current !== prev) {
        // Get now
        if ($scope.active) {
          // Set body
          body.css({ overflow: 'hidden' });
          adjustModalPosition();
        } else {
          // Remove 
          body.css({ overflow: prevBodyOverflow });
        }
      }
    });

    angular.element($window).on('resize', function() {
      adjustModalPosition();
    });

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };

  // Return directive
  return {
    link: link,
    scope: {
      active: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);
(function() {
	'use strict';

	angular.module('main')
		.directive('slidingMenu', slidingMenu);

	slidingMenu.$inject = [
		'$window',
		'$timeout',
		'$document',
		'$rootScope'
	];

	function slidingMenu($window, $timeout, $document, $rootScope) {
		return {
			restrict: 'A',
			link: linkFn
		};

		//////////////////////////////////////////

		function linkFn($scope, $element, $attr, $ctrl) {
			var menuScroll = null,
					menuWrapper = $element.find($attr.wrapper),
					pager = $element.find('.pager'),
					prevBtn = $element.find('.prev'),
					nextBtn = $element.find('.next');

			// console.log('directive init');
			$element.hide();

			$document.ready(function() {
				$timeout(function() {
					init();
				}, 200);
			});

			// window resize
			angular.element(window).bind('resize', function() {
          if (menuScroll) {
          	$timeout(function() {
          		computeWidth();
							menuScroll.reload();
						}, 300);
          }
      });

      $rootScope.gotoPage = $scope.gotoPage = function(index) {
      	// console.log(index);
      	if (menuScroll) {
      		menuScroll.activatePage(index);
      		$scope.gotoPageForIndex(index);
      	}
      };

			////////////////////////////////////

			function init() {
				$element.show();
				computeWidth();

				menuScroll = new Sly(menuWrapper, {
					horizontal: 1,
					itemNav: 'forceCentered',
					smart: 1,
					activateOn: 'click',
					activateMiddle: 1,
					mouseDragging: 1,
					touchDragging: 1,
					releaseSwing: 1,
					startAt: Number($attr.active),
					scrollBy: 1,
					speed: 300,
					elasticBounds: 1,
					dragHandle: 1,
					dynamicHandle: 1,
					clickBar: 1,
					// Buttons
					prev: prevBtn,
					next: nextBtn
				});

				menuScroll.on('active', setActiveItem);
				menuScroll.init();
			}

			function computeWidth() {
				var maxH = 0,
						menuWrapperWidth = menuWrapper.width(),
						minW = Math.ceil(menuWrapperWidth / 3),
						pad = 60;

				menuWrapper.find('li')
					.removeAttr('style')
					.each(function(){
					  var elem = $(this),
					  		w = elem.width();

					  if (w < minW) {
					  	elem.width(minW + pad);
					  } else {
					  	if (w >= menuWrapperWidth) {
					  		elem.width(menuWrapperWidth);
					  	} else {
					  		elem.width(w + pad);
					  	}
					  }
					});
			}

			function setActiveItem(eventName, i) {
				// console.log(eventName);
				pager.find('.dot').each(function(index){
				  var elem = $(this);

				  if (index === i) {
				  	elem.addClass('active');
				  } else {
				  	elem.removeClass('active');
				  }
				});
				$scope.gotoPageForIndex(i);
			}

			$element.on('$destroy', function() {
				if (menuScroll) {
					menuScroll.destroy();
					menuScroll = null;
				}
        return $scope.$destroy();
      });
		}
	}
})();

'use strict';

/**
 * Check network connectivity
 */
angular.module('main').directive('offline', ['$rootScope', '$window', function($rootScope, $window) {

  var link = function($scope, $element, $attributes, $parents, $transclude) {

    // Open
    $scope.offline = false;

    // State changed
    var networkStateChange = function(online) {
      // Call
      $rootScope.$broadcast('networkStateChange', online);
      // Set offline
      $scope.offline = !online;
    };

    // On online
    $window.Offline.on('up', function() {
      // Call
      networkStateChange(true);
    });
    // On offline
    $window.Offline.on('down', function() {
      // Call
      networkStateChange(false);
    });

    $transclude($scope, function(clone, scope) {
      // Replace
      $element.html(clone);
    });
  };

  return {
    link: link,
    restrict: 'A',
    transclude: true
  };
}]);
'use strict';

/**
 * Location
 */
angular.module('main').directive('location', [function() {

  var link = function($scope, $element, $attributes, $parents, $transclude) {

    // Open
    $scope.unavailable = false;

    $transclude($scope, function(clone, scope) {
      // Replace
      $element.html(clone);

      // On error
      $scope.$on('error', function($event, message) {
        // Set 
        // $scope.unavailable = true;
      });
    });
  };

  return {
    link: link,
    restrict: 'A',
    transclude: true
  };
}]);
'use strict';

angular.module('main').controller('MenuController', MenuController);

MenuController.$inject = [
  '$rootScope',
	'$scope',
	'$state',
	'$element',
	'$window',
	'Middleware',
	'$q',
	'Authentication',
	'$timeout',
  'API',
  'LangSvc'
];

function MenuController($rootScope, $scope, $state, $element, $window, Middleware, $q, Authentication, $timeout, API, LangSvc) {
  var element = angular.element($element);

  // The cities
  $scope.cities = {
    // Active city
    active: $rootScope.$currentCity || null,
    // Open
    open: false,
    busy: false,
    list: [],
    selected: false,
    toggle: function(open) {
      // If busy
      if ($scope.cities.busy) {
        return false;
      }
      // Set busy
      $scope.cities.busy = true;
      $scope.cities.open = 
        (typeof open === 'undefined') ?
        !$scope.cities.open :
        !!open;

      // If open
      if ($scope.cities.open) {
        // The lang
        var lang = (LangSvc.getLanguage() || '').toLowerCase();
        // Translate to sv, since we're using this now
        if (lang === 'se') {
          lang = 'sv';
        }
        // Get translated
        var translated = function(city) {
          // Loop throug translations
          for (var i = 0; i < city.translations.length; i++) {
            // If match
            if (city.translations[i].lang === lang) {
              // Return
              return city.translations[i].value;
            }
          }
        };
        // Each country
        $scope.cities.list.forEach(function(country) {
          // Sort
          country.cities.sort(function(a, b) {
            // Translated
            var translatedA = translated(a),
                translatedB = translated(b);
            // If less than b
            if (translatedA < translatedB) {
              // Return -1
              return -1;
            }
            // If greater
            if (translatedA > translatedB) {
              // Return 1
              return 1;
            }
            // Return 0
            return 0;
          });
        });
      }

      // Set timeout
      $timeout(function() {
        // Complete
        $scope.cities.busy = false;
      }, 250);
    },
    // Select city
    select: function(city) {
      // Broadcast change
      $rootScope.$broadcast('$changeCity', city);
      // Close
      $scope.cities.toggle(false);
      $scope.cities.selected = true;
    }
  };

  // On change
  $scope.$on('$changeCity', function(e, city, locationChanged) {
    // If not location changed
    if ((locationChanged && !$scope.cities.selected) ||
        !locationChanged) {
      // Set it
      $scope.cities.active = city;
    }
  });

  $scope.$on('bodyClick', function() {
    // If open
    if ($scope.cities.open) {
      // Close
      $scope.cities.toggle(false);
    }
  });

  $scope.$on('$activateCities', function(e, cities) {
    // Loop through list
    $scope.cities.list.forEach(function(country) {
      // Loop through cities
      (country.cities || []).forEach(function(city) {
        // Set
        city.hasEvents = ((cities || []).indexOf(city.ascii) >= 0);
      });
    });
  });

  var refreshCities = function() {
    // Get all cities
    API.get('venues/cities').then(function(response) {
      // Empty
      $scope.cities.list.length = 0;
      // The cities
      var cities = response.data || [];
      // Sort
      cities.sort(function(a, b) {
        // If less than b
        if (a.name < b.name) {
          // Return -1
          return -1;
        }
        // If greater
        if (a.name > b.name) {
          // Return 1
          return 1;
        }
        // Return 0
        return 0;
      });
      // Loop through data
      cities.forEach(function(city) {
        // Find country
        var countryIndex = (function() {
          // Loop through cities
          for (var i = 0; i < $scope.cities.list.length; i++) {
            if ($scope.cities.list[i].code.toLowerCase() === city.country.code.toLowerCase()) {
              // Return
              return i;
            }
          }
          return -1;
        })();
        // If there's no index
        if (countryIndex < 0) {
          // Set list
          city.country.cities = [];
          // Set index
          countryIndex = $scope.cities.list.length;
          // Add country
          $scope.cities.list.push(city.country);
        }
        // Add
        $scope.cities.list[countryIndex].cities.push(city);
      });
      // After listing, reset selected
      $scope.cities.selected = false;
    });
  };
  // Refresh
  refreshCities();
  // On update
  $rootScope.$on('updateCities', function() {
    // Must refresh
    // console.log('Force refresh');
    refreshCities();
  });

  // console.log($scope.lang, $scope.getLang());

  $scope.Authentication = Authentication;

  // Set current
  $scope.$state = null;
  // Params
  $scope.$stateParams = null;
  // Previous state
  $scope.$previous = null;
  // Previous params
  $scope.$previousParams = null;

  // Set prefix
  var landingPrefix = 'landing-';
  // Set pages
  $scope.landingPages = ['artview', 'artcache', 'now', 'lastchance', 'favorites'];

  $scope.artCache = $window.artCache;
  $scope.myArtCache = angular.copy($scope.artCache);

  // Menu Items Init
  $scope.menuItems = [];
  $scope.menuActive = 0;
  gatherMenuItems();

  $scope.hidePrev = false;
  $scope.hideNext = false;

	function gatherMenuItems() {
		$scope.menuItems.push({
			id: 'artview',
			title: 'Art View',
			sref: 'landing-artview'
		});
		_.forEach($scope.myArtCache, function(n) {
			$scope.menuItems.push({
				id: n.id,
				title: n.title,
				sref: 'landing-artcache'
			});
	  });
	  $scope.menuItems.push({
			id: 'now',
			title: 'Now',
			sref: 'landing-now'
		});
		$scope.menuItems.push({
			id: 'lastchance',
			title: 'Last Chance',
			sref: 'landing-lastchance'
		});
		$scope.menuItems.push({
			id: 'favorites',
			title: 'Favorites',
			sref: 'landing-favorites'
		});
	}

	function getActiveMenu(name) {
		var key = _.findKey($scope.menuItems, {
			sref: name
		});

		return key;
	}

	$scope.gotoPageForIndex = function(menuIndex) {
		$state.go($scope.menuItems[menuIndex].sref);
	};

  var refreshLandingPages = function() {

    var pre = ['artview'],
        post = ['now', 'lastchance', 'favorites'];

    $scope.landingPages = [];

    // Loop through
    for (var ii in pre) {
      $scope.landingPages.push(pre[ii]);
    }
    for (var ij in $scope.myArtCache) {
      $scope.landingPages.push('artcache');
    }
    for (var ik in post) {
      $scope.landingPages.push(post[ik]);
    }
  };

  var refreshArtCache = function() {
    Authentication.swear().promise.then(function() {

      if (Authentication.user && Authentication.user.hiddenArtCache) {
        // Empty myArtCache
        $scope.myArtCache = [];

        var hidden = [];

        // Loop
        for (var i in Authentication.user.hiddenArtCache) {
          // ac
          var ac = Authentication.user.hiddenArtCache[i],
              acId = ac._id || ac;
          // Push
          hidden.push(ac);
        }

        // Loop through cache
        for (var j in $scope.artCache)  {
          // Add
          if (hidden.indexOf($scope.artCache[j]._id) < 0) {
            $scope.myArtCache.push($scope.artCache[j]);
          }
        }

      } else {
        $scope.myArtCache = angular.copy($scope.artCache);
      }

      refreshLandingPages();

    });
  };

  $rootScope.$on('userChanged', function() {
    refreshArtCache();
  });

  refreshArtCache();

  // Active landing
  $scope.activeLanding = '';

  $scope.active = function(menu) {
    // If there's no state yet, don't initialize
    if (!$scope.$state) return false;
    // Pages
    var pages = [];
    // Check if menu is among the three
    if (['main', 'landing', 'mobile'].indexOf(menu) >= 0) {
      for (var i in $scope.landingPages) {
        // Append
        pages.push(landingPrefix + $scope.landingPages[i]);
      }
    }
    // Main only
    if (['main'].indexOf(menu) >= 0) {
      // Add
      pages.push('404');
    }
    if (['user'].indexOf(menu) >= 0) {
      // Set pages
      pages = ['venue', 'exhibition', 'artist'];
    }
    if (['authenticated'].indexOf(menu) >= 0) {
      // Set pages
      pages = ['profile', 'venue-create', 'venue-edit', 'exhibition-create', 'exhibition-edit', 'artcache'];
    }
    return pages.indexOf($scope.$state.name) >= 0;
  };

  // Update fade
  var updateSideFade = function(state) {
    // Wait 50 ms
    $scope.menuActive = getActiveMenu(state.name);

    if ($window.device === 'mobile' && $window.lang === 'fi' && state.name === 'landing-artview') {
      $scope.hidePrev = true;
      $scope.hideNext = true;
    } else {
      $scope.hidePrev = false;
      $scope.hideNext = false;
    }
  };

  /**
   * Fix for Home button not moving the menu
   */
  // Go home
  $scope.goHome = function() {
    // If there's goToPage
    if ($rootScope.gotoPage) {
      // Landing
      var landingName = 'landing';
      // Check current
      if ($state.current && $state.current.name.substr(0, landingName.length) === landingName) {
        // Home index
        var homeIndex = 0;
        // Find now
        for (var i in $scope.menuItems) {
          // If now
          if ($scope.menuItems[i].sref === 'landing-now') {
            // Set
            homeIndex = i;
            break;
          }
        }
        // Go
        $rootScope.gotoPage(homeIndex);
      }
    }
  };

  // When state changes
  $scope.$on('stateChanged', function(event, args) {
    // Set new state
    $scope.$state = args.toState;
    $scope.$stateParams = args.toParams;
    $scope.$previous = args.fromState;
    $scope.$previousParams = args.fromParams;

    updateSideFade($scope.$state);

    if ($scope.swiperNoSwiping) {
      return false;
    }

    if (!Middleware.filter($scope.$state, $scope.$stateParams)) {
      return false;
    }

    // Set page
    var page = args.toState.name.substr(landingPrefix.length);
    // If menu is hidden
    if ($element.is(':hidden')) {
      // Show it
      $element.show(200);
    }
  });

  $scope.$on('deviceChanged', function() {
    if ($state.current) {
      updateSideFade($state.current);
    }
  });

  $scope.initLanding = function() {
    if ($state.current) {
      updateSideFade($state.current);
    }
  };

  $scope.back = function() {
    // Go
    return $state.go('landing-now');
    // return $rootScope.previousState ? $state.go($rootScope.previousState) : $state.go('landing-now');
  };
}

'use strict';

angular.module('main').controller('FooterController', ['$scope', '$state', '$element', '$window',
  function($scope, $state, $element, $window) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    // Set state
    $scope.$state = null;

    $scope.show = function() {
      // If no status
      if (!$scope.$state || !$scope.$state.name) {
        // False
        return false;
      }
      var pages = [
        'authentication',
        'profile',
        // Landing pages
        'landing-artview', 'landing-artcache', 'landing-now', 'landing-favorites', 'landing-lastchance', 
        'exhibition',
        'artist'
      ];
      return pages.indexOf($scope.$state.name) >= 0;
    };

    // When state changes
    $scope.$on('stateChanged', function(event, args) {
      // Set new state
      $scope.$state = args.toState;
    });

  }
]);
'use strict';

angular.module('main').controller('SplashController', SplashController);

SplashController.$inject = [
	'$window',
	'$scope',
	'$resource',
	'$state',
	'Authentication',
	'API',
	'$http',
	'LangSvc'
];

function SplashController($window, $scope, $resource, $state, Authentication, API, $http, LangSvc) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.languages = ['en', 'fi', 'se', 'de'];
  $window.hasFooter = false;

  // Active language
  $scope.activeLang = function(lang) {
    // Return
    return lang === LangSvc.getLanguage();
  };
  // Select
  $scope.selectLang = function(lang) {
    // Set lang
    LangSvc.setLanguage(lang);

    // If there's user
    if (Authentication.token) {
      // Set lang
      // Update
      API.put('me', { user: { lang: lang } }).then(function(response) {
      // Set lang
        $state.go('authentication');
      });
    } else {
      // Set lang
      $http.post('/lang', { lang: lang }).then(function(response) {
        // Go
        $state.go('authentication');
      });
    }
  };
}

'use strict';

angular.module('main').controller('AuthenticationController', AuthenticationController);

AuthenticationController.$inject = [
	'$scope',
	'$location',
	'$http',
	'$state',
	'$stateParams',
	'$element',
	'Authentication',
	'$window',
	'genres',
	'LangSvc'
];

function AuthenticationController($scope, $location, $http, $state, $stateParams, $element, Authentication, $window, genres, LangSvc) {
  // This provides Authentication context.
  $scope.auth = Authentication;

  // Next
  $scope.next = function() {
    // Check if there's next
    if ($stateParams.next) {
      // Redirect
      $location.url(decodeURIComponent(($stateParams.next+'').replace(/\+/g, '%20')));
    } else {
      $state.go('landing-now');
    }
  };

  var animSpd = 200;

  $scope.form = {
    guest: {
      input: {},
      show: false,
      response: {
        success: true,
        message: ''
      },
      submit: function() {
        // Just go
        $state.go('landing-now');
      }
    },
    login: {
      element: angular.element($element).find('.form.login:first'),
      input: {},
      show: false,
      busy: false,
      response: {
        success: true,
        message: ''
      },
      toggle: function(show, done) {
        var _this = this;
        if (typeof show === 'undefined') {
          show = _this.show;
          // Hide join
          $scope.form.join.toggle(true);
        }
        // If shown
        if (show) {
          // Hide
          _this.element.removeClass('toggled');
          _this.element.find('.submit:first').hide(animSpd, function() {
            _this.show = false;
            _this.element.removeClass('show toggling');
          });
        } else {
          // Show
          _this.element.addClass('toggled');
          _this.element.find('.submit:first').show(animSpd, function() {
            _this.show = true;
            _this.element.addClass('show');
          });
        }
      },
      submit: function(email, password, silent) {
        var _this = this;
        if (this.busy) {
          return false;
        }
        this.busy = true;
        this.response.message = '';
        // Overwrite
        if (!email) {
          email = this.input.email;
        }
        if (!password) {
          password = this.input.password;
        }
        // Submit
        $http.post('/api/authenticate', { email: email, password: password })
          .success(function(response) {
            // If success
            if (response.success) {
              // Set token
              Authentication.token = response.token;
              $window.token = response.token;

              if (!silent) {
                $scope.form.login.response.success = true;
                $scope.form.login.response.message = 'Login successful';
              }
              // Set lang
              if (response.lang) {
                // Set lang
                LangSvc.setLanguage(response.lang);
              }

              // Swear
              Authentication.swear();

              // Redirect to landing/now page
              $scope.next();
            } else {
              // Set error
              if (!silent) {
                $scope.form.login.response = response;
              }
            }
            _this.busy = false;
          })
          .error(function(response) {
            // Error
            if (!silent) {
              $scope.form.login.response.success = false;
              $scope.form.login.response.message = 'Login error';
            }
            _this.busy = false;
          });

        return false;
      }
    },
    join: {
      element: angular.element($element).find('.form.join:first'),
      input: { name: {}, type: 'artlover', genres: [] },
      show: false,
      busy: false,
      typeActive: function(type) {
        return this.input.type === type;
      },
      genreActive: function(genre) {
        return this.input.genres.indexOf(genre) >= 0;
      },
      types: [
        {
          name: 'artlover',
          title: 'art lover'
        },
        {
          name: 'artist',
          title: 'artist'
        },
        {
          name: 'organizer',
          title: 'event organizer',
          hint: 'eg gallery, museum, art festival'
        }
      ],
      genres: genres,
      response: {
        success: true,
        message: ''
      },
      toggle: function(show, done) {
        var _this = this;
        if (typeof show === 'undefined') {
          show = _this.show;
          // Hide login
          $scope.form.login.toggle(true);
        }
        // If shown
        if (show) {
          // Hide
          _this.element.removeClass('toggled');
          _this.element.find('.submit:first').hide(animSpd, function() {
            _this.show = false;
            _this.element.removeClass('show toggling');
          });
        } else {
          // Show
          _this.element.addClass('toggled');
          _this.element.find('.submit:first').show(animSpd, function() {
            _this.show = true;
            _this.element.addClass('show');
          });
        }
      },
      submit: function() {
        var _this = this;
        if (this.busy) {
          return false;
        }
        this.busy = true;
        this.response.message = '';
        // Make sure all fields are valid
        var required = {
          email: { value: this.input.email, title: 'Email address' },
          password: { value: this.input.password, title: 'Password' }
        };

        if (this.input.type !== 'organizer') {
          required.firstName = { value: this.input.name.first, title: 'First name' };
          required.lastName = { value: this.input.name.last, title: 'Last name' };
        }

        // Loop
        for (var i in required) {
          // Trim
          required[i].value = angular.element.trim(required[i].value);
          // If empty
          if (!required[i].value) {
            // Exit immediately
            $scope.form.join.response.success = false;
            $scope.form.join.response.message = required[i].title + ' is required';
            return false;
          }
        }
        // Check if password match
        if (this.input.password !== this.input.confirm) {
          // Exit
          $scope.form.join.response.success = false;
          $scope.form.join.response.message = 'Password does not match';
          return false;
        }
        // Submit
        $http.post('/api/register', this.input)
          .success(function(response) {
            // If successful
            if (response.success) {
              // Login user right away
              $scope.form.login.submit(required.email.value, required.password.value, true);
            } else {
              $scope.form.join.response = response;
            }
            _this.busy = false;
          })
          .error(function(response) {
            // Error
            $scope.form.join.response.success = false;
            $scope.form.join.response.message = 'Register error';
            _this.busy = false;
          });

        return false;
      }
    }
  };

  // Get action
  var action = $stateParams.action;
  var message = $stateParams.message;

  if (action) {
    // Do toggle
    $scope.form[action].toggle();
    // If there's message
    if (message) {
      // Set message
      $scope.form[action].response.success = false;
      $scope.form[action].response.message = message;
    }
  }
}

'use strict';

angular.module('main').controller('FeedbackController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.

    $scope.loggedIn = Authentication.token;

    $scope.back = function() {
      $window.history.back();
    };

    $scope.input = {};
    $scope.response = {
      success: false,
      message: ''
    };
    $scope.busy = false;

    $scope.submit = function() {
      if ($scope.busy) {
        return false;
      }
      // Busy
      $scope.busy = true;
      $scope.response.success = true;
      $scope.response.message = 'Sending feedback';
      // API
      API.post('feedback', $scope.input).then(function(response) {
        // Set resonse
        $scope.busy = false;
        $scope.response.success = response.data.success;
        $scope.response.message = response.data.message;

        if (response.data.success) {
          // Empty
          $scope.input.subject = '';
          $scope.input.content = '';
        }
      });

    };

  }
]);
'use strict';

angular.module('main').controller('ReportController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.

    $scope.loggedIn = Authentication.token;

    $scope.back = function() {
      $window.history.back();
    };

    // If no URL, go to landing page
    if (!$state.params.url) {
      $state.go('landing-now');
      return false;
    }

    $scope.input = {
      url: $state.params.url
    };
    $scope.response = {
      success: false,
      message: ''
    };
    $scope.busy = false;

    $scope.submit = function() {
      if ($scope.busy) {
        return false;
      }
      // Busy
      $scope.busy = true;
      $scope.response.success = true;
      $scope.response.message = 'Sending report';
      // API
      API.post('report', $scope.input).then(function(response) {
        // Set resonse
        $scope.busy = false;
        $scope.response.success = response.data.success;
        $scope.response.message = response.data.message;

        if (response.data.success) {
          // Empty
          $scope.input.subject = '';
          $scope.input.content = '';
          // Go back
          $scope.back();
        }
      });

    };

  }
]);
'use strict';

angular.module('main').controller('InviteController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

    $scope.input = {};
    $scope.response = {
      success: false,
      message: ''
    };
    $scope.busy = false;

    $scope.submit = function() {
      if ($scope.busy) {
        return false;
      }
      // Busy
      $scope.busy = true;
      $scope.response.success = true;
      $scope.response.message = 'Sending invitations';
      // API
      API.post('invite', $scope.input).then(function(response) {
        // Set resonse
        $scope.busy = false;
        $scope.response.success = response.data.success;
        $scope.response.message = response.data.message;

        if (response.data.success) {
          // Empty
          $scope.input.emails = '';
        }
      });

    };

  }
]);
'use strict';

angular.module('main').controller('ForgotPasswordController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', '$stateParams', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, $stateParams, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

    $scope.email = $stateParams.email || '';
    $scope.success = true;
    $scope.message = '';
    $scope.busy = false;

    // Request
    $scope.request = function() {

      if (!angular.element.trim($scope.email)) {
        $scope.success = false;
        $scope.message = 'Email address is required';
        return false;
      }

      if ($scope.busy) {
        return false;
      }
      $scope.busy = true;
      $scope.success = true;
      $scope.message = 'Processing request';

      // Do submit
      API.post('authenticate/passwordreset', {
        email: $scope.email
      }).then(function(response) {
        // Set message
        $scope.success = response.data.success;
        $scope.message = response.data.message;

        if ($scope.success) {
          $scope.email = '';
        }
        $scope.busy = false;
      });
    };

    // If there's code
    if ($stateParams.email && $stateParams.code) {
      $scope.busy = true;
      $scope.success = true;
      $scope.message = 'Completing password reset';
      // Submit
      API.post('authenticate/passwordreset', {
        email: $stateParams.email,
        code: $stateParams.code
      }).then(function(response) {
        // Set message
        $scope.success = response.data.success;
        $scope.message = response.data.message;
        $scope.busy = false;
      });
    }

  }
]);
'use strict';

angular.module('main').controller('SettingsController', SettingsController);

SettingsController.$inject = [
	'$window',
	'$location',
	'$element',
	'$scope',
	'$timeout',
	'$resource',
	'$state',
	'Authentication',
	'API',
	'Upload',
	'genres',
	'LangSvc'
];

function SettingsController($window, $location, $element, $scope, $timeout, $resource, $state, Authentication, API, Upload, genres, LangSvc) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.admin = !!$window.admin;

  $scope.goAdmin = function() {
    $window.location = '/admin/';
  };

  var toggleSpd = 200;
  // Set user
  $scope.user = {
    name: {},
    lang: LangSvc.getLanguage()
  };

  $scope.changeLang = function(lang) {
    $scope.user.lang = lang;
    $window.lang = lang;
  };

  // Logged in
  $scope.userLoggedIn = function() {
    return Authentication.token;
  };

  // Genres
  $scope.genres = genres;
  $scope.genreActive = function(genre) {
    // Return
    return $scope.user.genres && ($scope.user.genres.indexOf(genre) >= 0);
  };

  // Add link
  $scope.addLink = function() {
    $scope.user.links.push({
      title: '',
      url: ''
    });
  };
  // Remove link
  $scope.removeLink = function($index) {
    $scope.user.links.splice($index, 1);
  };

  // Email
  $scope.email = {
    old: '',
    'new': '',
    code: '',
    message: '',
    status: '',
    busy: false,
    update: function(email, code) {
      if (this.busy) {
        return false;
      }
      var _this = this;
      this.status = 'error';
      this.message = '';

      API.put('me/email', { email: email, code: code }).then(function(response) {
        // Set status message
        _this.status = response.data.success ? 'success' : 'error';
        _this.message = response.data.message;
        // Done
        _this.busy = false;

        // If success
        if (response.data.success) {
          // Set old
          $timeout(function() {
            $scope.email.old = response.data.message;
            $scope.email['new'] = response.data.message;
            _this.message = 'Email successfully changed';
          }, 1);
        }
      });
    },
    change: function() {
      // If still changing
      if (this.busy) {
        // Exit
        return false;
      }
      // Set this
      var _this = this;
      // Change message
      this.status = 'error';
      this.message = '';

      // If matches
      if (this.old === this['new']) {
        // Return
        return false;
      }
      // Set busy
      this.busy = true;

      // Change message
      this.status = 'success';
      this.message = 'Processing request...';

      API.put('me/email', { email: _this['new'] }).then(function(response) {
        // Set status message
        _this.status = response.data.success ? 'success' : 'error';
        _this.message = response.data.message;
        // Done
        _this.busy = false;
      });
    }
  };

  // Username
  $scope.username = {
    value: '',
    message: '',
    status: '',
    busy: false,
    change: function() {
      // If still changing
      if (this.busy || ($scope.user && ($scope.username.value === $scope.user.username))) {
        // Exit
        return false;
      }
      // Set this
      var _this = this;
      // Change message
      this.status = 'error';
      this.message = '';

      // If not match
      if (!$scope.username.value) {
        // Error
        this.message = 'Type username';
        return false;
      }

      // Set busy
      this.busy = true;

      // Change password
      API.put('me/username', {
        username: $scope.username.value
      }).then(function(response) {
        // Set status message
        _this.status = response.data.success ? 'success' : 'error';
        _this.message = response.data.message;

        if (response.data.success) {
          // Set username
          $scope.user.username = $scope.username.value.toLowerCase();
        }

        // Done
        _this.busy = false;
      });
    }
  };

  // Password
  $scope.password = {
    old: '',
    'new': '',
    confirm: '',
    message: '',
    status: '',
    busy: false,
    change: function() {
      // If still changing
      if (this.busy) {
        // Exit
        return false;
      }
      // Set this
      var _this = this;
      // Change message
      this.status = 'error';
      this.message = '';

      // If there's no input
      if (!this.old || !this['new']) {
        // Error
        this.message = 'All fields are required';
        return false;
      }
      // If not match
      if (this['new'] !== this.confirm) {
        // Error
        this.message = 'Password does not match';
        return false;
      }

      // Set busy
      this.busy = true;

      // Change password
      API.put('me/password', {
        old: this.old,
        'new': this['new']
      }).then(function(response) {
        // Set status message
        _this.status = response.data.success ? 'success' : 'error';
        _this.message = response.data.message;
        // If success
        if (response.data.success) {
          // Empty passwords
          angular.element($element).find('.password input').val('');
        }
        // Done
        _this.busy = false;
      });
    }
  };

  $scope.social = {
    types: [
      {
        name: 'facebook',
        title: 'Facebook'
      },
      {
        name: 'google',
        title: 'Google'
      }
    ],
    linked: function(type) {
      /*if (type === 'facebook') {
        // Return email
        return $scope.user.email;
      }*/
      // If no social
      if (!$scope.user.social || !$scope.user.social.length) {
        return false;
      }
      // Loop through social
      for (var i in $scope.user.social) {
        // If found
        if ($scope.user.social[i].name === type) {
          return true;
        }
      }
      return false;
    },
    unlink: function(name) {
      // Request
      API.delete('me/social/' + name).then(function(response) {
        // Set new social
        $scope.user.social = response.data;
      });
    }
  };

  $scope.notification = {
    active: false,
    toggle: function(on) {
      this.active = on;
      if ($scope.user) {
        $scope.user.notifications = on ? 'on' : 'off';
      }
    }
  };

  $scope.language = {
    list: [
      {
        name: 'en',
        title: 'English'
      },
      {
        name: 'fi',
        title: 'Finnish'
      },
      {
        name: 'se',
        title: 'Swedish'
      },
      {
        name: 'de',
        title: 'Deutch'
      }
    ]
  };

  $scope.profileType = {
    list: [
      {
        name: 'artlover',
        title: 'Art lover'
      },
      {
        name: 'artist',
        title: 'Artist'
      },
      {
        name: 'organizer',
        title: 'Event organizer'
      }
    ]
  };

  $scope.profileMessage = '';

  // Update user
  var updateUser = function() {
    // Just update the language
    LangSvc.setLanguage($scope.user.lang);

    // If there's no user
    if (!Authentication.token) {
      return false;
    }

    $scope.profileMessage = 'Saving';

    // Get user
    var user = {
      name: {
        first: $scope.user.name.first || '',
        last: $scope.user.name.last || ''
      },
      description: $scope.user.description,
      genres: $scope.user.genres,
      links: $scope.user.links,
      lang: $scope.user.lang,
      profileType: $scope.user.profileType,
      notifications: $scope.user.notifications
    };
    // Update
    API.put('me', { user: user }).then(function(response) {
      // Saved
      $scope.profileMessage = 'Saved';
    });
  };

  // Set delay
  var updateDelay, delayLength = 1000; // 2 seconds

  // Watch user
  var watchUser = function() {
    // Set a little delay
    setTimeout(function() {
      $scope.$watch('user', function(newUser, oldUser) {
        // If value changed
        if (newUser !== oldUser) {
          // Cancel timeout
          if (updateDelay) {
            $timeout.cancel(updateDelay);
          }
          // Set timeout
          updateDelay = $timeout(function() {
            // Update
            updateUser();
          }, delayLength);
        }
      }, true);
    }, 1000);
  };

  $scope.toggleList = function(li) {
    // Ul
    var ul = li.find('ul:first');
    // If animated
    if (ul.is(':animated')) {
      // Quit
      return false;
    }
    // If open
    if (li.hasClass('open')) {
      // Close
      ul.hide(toggleSpd, function() {
        li.removeClass('open');
      });
    } else {
      // Open
      ul.show(toggleSpd, function() {
        li.addClass('open');
      });
    }
  };

  // Toggle setting
  $scope.toggleSetting = function($event) {
    // Element
    var element = angular.element($event.currentTarget);
    // Get li
    $scope.toggleList(element.parent());
  };

  /**
   * Logout
   */
  $scope.logout = function() {
    // Do logout
    API.delete('authenticate/logout', {})
      .then(function(response) {
        // Empty token
        Authentication.token = null;
        // Redirect
        $state.go('authentication');
      });
  };

  // Get user
  $scope.getLoggedInUser = function(done) {
    // If there's no usr
    if (!Authentication.token) {
      // Quit
      done($scope.user);
      return false;
    }
    // Query
    API.get('me').then(function(response) {
      // Set user
      $scope.user = response.data || null;
      $scope.username.value = $scope.user ? ($scope.user.username || '') : '';
      $scope.email.old = $scope.email['new'] = $scope.user.email;
      $scope.notification.active = $scope.user ? ($scope.user.notifications === 'on') : false;

      if ($scope.user && (!$scope.user.links || $scope.user.links.length === 0)) {
        $scope.user.links = [
          { title: '', 'url': '' }
        ];
      }

      // If there's photo
      if ($scope.user.photo) {
        // Set it
        $scope.photo.source = '/' + $scope.user.photo.source;
      }

      done($scope.user);
    });
  };
  // Get logged in
  $scope.getLoggedInUser(function(user) {
    // Begin watch after loading user
    // Watch user
    watchUser();
  });

  $scope.confirmClose = false;
  /**
   * Close account
   */
  $scope.closeAccount = function() {
    // Close
    API.delete('me').then(function(response) {
      // Redirect
      $window.location = '/authentication';
    });
  };

  /**
   * User photo
   */
  $scope.photo = {
    files: [],
    source: '',
    upload: function(files) {
      // If no files
      if (!files || !files.length) {
        // Quit
        return false;
      }
      // Do upload
      Upload.upload({
        url: '/api/upload',
        fields: { },
        file: files[0]
      }).progress(function(evt) {

      }).success(function(data, status, headers, config) {
        // Set source
        $scope.photo.source = '/' + data.file.full;
        // Save photo
        API.put('me/photo', {
          source: $scope.photo.source.substr(1)
        }).then(function(response) {
          // Do nothing
        });
      });
    }
  };

  $scope.back = function() {
    return $state.go('landing-now');
    // $window.history.back();
  };

  // Check for query
  var query = $location.search();
  // Check for email and code
  if (query.email && query.code && $scope.userLoggedIn()) {
    // Update
    $scope.toggleList($element.find('li.email:first'));
    $scope.email.update(query.email, query.code);
  }

}

'use strict';

angular.module('main').controller('AboutTermsController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

  }
]);
'use strict';

angular.module('main').controller('PrivacyPolicyController', ['$window', '$element', '$scope', '$timeout', '$resource', '$state', 'Authentication', 'API',
  function($window, $element, $scope, $timeout, $resource, $state, Authentication, API) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.back = function() {
      $window.history.back();
    };

  }
]);
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

'use strict';

angular.module('main').controller('ArtViewController', ArtViewController);

ArtViewController.$inject = [
	'$scope',
	'$resource',
	'$document',
	'API',
	'$window',
	'$timeout'
];

function ArtViewController($scope, $resource, $document, API, $window, $timeout) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.arts = [];
  $scope.current = 0;
  $scope.limit = 12;

  var adjustModalPosition = function() {
    // Get wrap
    var wrap = angular.element('#modal .wrap:first');
    // Get window and wrap height
    var winHeight = angular.element($window).height(),
        wrapHeight = wrap.height();
    // Set top
    wrap.css('top', ((winHeight / 2) - (wrapHeight / 2)) + 'px');
  };

  $scope.modal = {
    show: false,
    open: function() {

      angular.element('body').addClass('enclosed');
      this.show = true;

      $timeout(function() {
        adjustModalPosition();
      }, 50);
    },
    close: function() {

      angular.element('body').removeClass('enclosed');
      this.show = false;
    },
    toggle: function() {
      return this.show ? this.close() : this.open();
    }
  };

  $scope.$on('$destroy', function() {
    // console.log('Destroyed!');
    $scope.modal.close();
  });

  $scope.preview = {
    index: 0,
    art: null,
    show: function(index) {
      // If there's nothing
      if (!$scope.arts.length) {
        return false;
      }
      if (!$scope.arts[index]) {
        return false;
      }
      // Get art
      this.art = $scope.arts[index];

      // elem
      var elem = angular.element('#preview');
      elem.addClass('show');

      if ($scope.initialized) {
        $scope.modal.open();
      }

      this.index = index;
      // $document.scrollTo(elem, 20, 400);
    },
    previous: function() {
      this.show(this.index - 1);
    },
    next: function() {
      this.show(this.index + 1);
    }
  };

  $scope.initialized = false;
  $scope.initialize = function() {
    $scope.preview.show(0);
    $scope.initialized = true;
  };

  $scope.ended = false;

  // Loaded
  $scope.loaded = [];

  var getLoadedArtsIds = function() {
    // Ids
    var ids = [];
    // Loop through arts
    ($scope.arts || []).forEach(function(art) {
      // Get id
      ids.push(art.photo.photo.id);
    });
    // Return
    return ids;
  };

  // Find photo in gallery
  var findPhotoInGallery = function(gallery, photo) {
    // Find in gallery
    for (var k in gallery.photos) {
      if (gallery.photos[k].photo === photo.id) {
        // Set photo
        gallery.photos[k].photo = photo;
        // Return
        return gallery.photos[k];
      }
    }
    return null;
  };

  // Populate
  $scope.loadArts = function(done) {

    // If already in loaded
    if ($scope.loaded.indexOf($scope.current) >= 0) {
      // Return
      return false;
    }

    // Add to loaded
    $scope.loaded.push($scope.current);

    // if ($scope.initialized) return false;
    // Use POST API
    API.post('galleries', {
      start: $scope.current,
      limit: $scope.limit,
      exclude: getLoadedArtsIds().join(',')
    }).then(function(response) {

      // If there's any
      var photos = response.data.data;

      if (!photos || !photos.length) {
        $scope.ended = true;
      }

      if (photos.length) {
        for (var i in photos) {
          // Photo
          var photo = photos[i];
          var thePhoto = findPhotoInGallery(photo.gallery, photo);

          if (thePhoto) {
            // Add to arts
            $scope.arts.push({
              exhibition: photo.gallery.exhibition,
              photo: thePhoto
            });
          }
        }
      }
      if (!$scope.initialized) {
        $scope.initialize();
      }
      $scope.current += $scope.limit;
      $scope.limit = 6;
      if (done) done();
    });
  };

  angular.element($window).on('resize', function() {
    adjustModalPosition();
  });

  $scope.brickHeight = function(image) {
    // Set width
    var width = 0;
    // Get device
    switch (device) {
      case 'extraLargeDesktop': width = 304; break;
      case 'largeDesktop': width = 263.993; break;
      case 'desktop': width = 202; break;
      case 'tablet': width = 162.5; break;
      case 'mobile': width = 91.3125; break;
    }
    // Get image ratio
    var ratio = image.width / image.height;
    // Return height
    return width / ratio;
  };

  $scope.reconstruct = function() {
    $timeout(function() {
      $scope.arts = angular.copy($scope.arts);
    }, 1);
  };

  $scope.$on('deviceChanged', function() {
    $scope.reconstruct();
  });

  // $scope.reconstruct();
}

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

'use strict';

angular.module('main').controller('LastChanceController', [
  '$rootScope', '$scope', '$resource', 'Authentication', 'API',
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

      // If already in loaded
      if ($scope.loaded.indexOf($scope.current) >= 0 ||
          !$rootScope.$currentCity) {
        // Return
        return false;
      }

      // Add to loaded
      $scope.loaded.push($scope.current);

      // The filters
      var filters = {
        start: $scope.current,
        limit: $scope.limit,
        landing: 'lastchance',
        sort: '-recommended',
        city: $rootScope.$currentCity.lcase
      };

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

    $scope.$on('$changeCity', $scope.restart);
  }
]);

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

'use strict';

angular.module('main').controller('CreateVenueController', [
  '$rootScope', '$scope', '$resource', '$state', '$window', 'Upload', 'API', 'MapOptions', 'uiGmapGoogleMapApi', '$timeout', 'moment', '$element',
  function($rootScope, $scope, $resource, $state, $window, Upload, API, MapOptions, uiGmapGoogleMapApi, $timeout, moment, $element) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    $scope.today = moment();

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
          // Do geocode
          $scope.map.geocode();
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
      // console.log('openingHours', $scope.form.input.openingHours, $scope.form.input.openingHours[dayIndex], dayIndex);
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
          name: '12–18',
          title: '12 € –18 €'
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
        venueType: 'gallery',
        venueTypes: [
          'gallery'
        ],
        admissionFee: 'free',
        address: {
          full: '',
          city: '',
          country: [],
          lang: 'en',
          coordinates: {
            latitude: 60.173324,
            longitude: 24.941025
          }
        },
        openingHours: defaultOpeningHours.slice(0),
        specialHours: defaultSpecialHours.slice(0),
        links: [{
          title: '',
          url: ''
        }]
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
          // Post
          API.post('venues', _this.input).then(function(response) {
            // Set response
            _this.response = response.data;

            if (response.data.success) {
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

    // Set center
    // $scope.map.center = $scope.form.input.address.coordinates;

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
  }
]);

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

'use strict';

angular.module('main').controller('EditExhibitionController', ['$scope', '$resource', '$state', '$window', 'Upload', 'API', 'moment', '$element', '$rootScope', '$templateCache', '$timeout', 'genres', '$q',
  function($scope, $resource, $state, $window, Upload, API, moment, $element, $rootScope, $templateCache, $timeout, genres, $q) {
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

    angular.element('tags-input').each(function() {
      // Input
      var input = angular.element(this), name = input.attr('name');
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
            $scope.photos[index].blurred = false;
            elem('#photo-' + config.file.uploadId).removeClass('loading');
          }
        });
        /* jshint ignore:end */
      }
    };

    // Load
    $scope.loadExhibition = function(done) {
      // Load
      API.get('events/' + $state.params.permalink)
        .then(function(response) {

          // If not owner
          if (!response.data.owned) {

            $state.go('profile');

            // Exit
            return false;
          }

          // Set to input
          $scope.form.input = response.data;

          // Set venue in array
          $scope.form.input.venue = [response.data.venue];
          // Set photos
          $scope.photos = [];
          // Loop through photos
          if (response.data.gallery && response.data.gallery.photos) {
            for (var i in response.data.gallery.photos) {
              // Set photo
              var photo = response.data.gallery.photos[i];
              // Set photos
              $scope.photos.push({
                id: photo.photo._id,
                _id: photo.photo._id,
                title: photo.photo.title,
                caption: photo.caption,
                source: photo.photo.source,
                artists: photo.artists,
                nonUserArtists: photo.nonUserArtists
              });
            }
          }

          // Edit artists
          var artists = [],
              uniqueArtists = [];

          for (var n in response.data.artists) {
            var artist = response.data.artists[n];

            if (artist.user && artist.user._id) {

              if (uniqueArtists.indexOf(artist.user._id) < 0) {
                artists.push(artist.user);
                uniqueArtists.push(artist.user._id);
              }

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

          var dateStart = moment(response.data.startDate),
              dateEnd = moment(response.data.endDate);

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

        // console.log(_this.input.startDate);
        // console.log(_this.input.endDate);

        // Convert date to moment
        // _this.input.startDate = moment(_this.input.startDate);
        // _this.input.endDate = moment(_this.input.endDate);

        // Post
        API.put('events/' + $state.params.permalink, _this.input).then(function(response) {
          // Set response
          _this.response = response.data;
          // If success
          if (_this.response.success) {
            // Set message
            _this.response.message = 'Event successfully updated';
            // Redirect
            $scope.redirect = ['exhibition', { permalink: response.data.data.permalink }];
          }

          /*
          if (_this.response.success && _this.response.data.permalink !== $state.params.permalink) {
            // Redirect to edit page
            $state.go('exhibition-edit', { permalink: _this.response.data.permalink });
          }
          */
        });
      }
    };

    $scope.confirmDelete = false;
    // Delete
    $scope.delete = function() {
      // Delete
      API.delete('events/' + $state.params.permalink).then(function(response) {
        // Redirect
        $state.go('profile');
      });
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

'use strict';

angular.module('main').controller('ArtistController', ArtistController);

ArtistController.$inject = [
	'$rootScope',
	'$scope',
	'$resource',
	'$state',
	'$timeout',
	'API',
	'Authentication',
	'Upload',
	'moment'
];

function ArtistController($rootScope, $scope, $resource, $state, $timeout, API, Authentication, Upload, moment) {
  // This provides Authentication context.
  $scope.auth = Authentication;

  $scope.owner = function() {
    return ($scope.auth && $scope.auth.user && $scope.auth.user._id &&
            $scope.artist && $scope.artist.id && ($scope.auth.user._id === $scope.artist.id));
  };

  // Photos
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
      $scope.photos.unshift({
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

        // If success
        if (data.success) {
          // Save photo
          API.post('/me/photo', { source: data.file.full }).then(function(response) {
            // Get the last loading photo
            var lastLoading = -1;

            for (var h in $scope.photos) {
              // If loading
              if ($scope.photos[h].loading) {
                // Set as last
                lastLoading = h;
              } else {
                // Break
                break;
              }
            }

            // If there's any
            if (lastLoading >= 0) {
              // If there's data
              if (response.data && response.data._id) {
                // Change
                $scope.photos[lastLoading] = response.data;
              } else {
                // Error
                // Remove first
                $scope.photos.splice(0, 1);
              }
            }
          });
        } else {
          // Remove first
          $scope.photos.splice(0, 1);
        }

      });
      /* jshint ignore:end */
    }
  };

  // Remove photo
  $scope.removePhoto = function(photo) {
    // Are you sure
    if (confirm('Are you sure you want to remove this photo? Press OK to continue')) {
      // Remove
      API.delete('me/photo/' + (photo._id || photo.id)).then(function(response) {
        // If success
        if (response.data && response.data.success) {
          // Remove
          for (var i in $scope.photos) {
            // If match
            if ($scope.photos[i].id === photo.id) {
              // Remove
              $scope.photos.splice(i, 1);
              break;
            }
          }
        }
      });
    }
  };

  $scope.photo = null;

  // Edit photo
  $scope.editPhoto = function(photo) {
    // Set photo
    $scope.photo = photo;
    // Watch
    $scope.artists.watchPhoto();
  };

  // The artist
  $scope.artists = {
    /**
     * Load artists
     */
    load: function(query) {
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
    added: function(tag) {
      // Increment
      $scope.artists.tagCounter++;
      // Set id if there's none
      if (!tag._id) {
        tag._id = $scope.artists.tagCounter;
        tag.guest = true;
      }
    },
    // Get ids
    getIds: function() {
      var ids = [];
      // Loop through artsits
      if ($scope.photo.artists && $scope.photo.artists.length) {
        for  (var i in $scope.photo.artists) {
          // Add to ids
          ids.push($scope.photo.artists[i].id);
        }
      }
      // Return ids
      return ids;
    },
    save: function() {
      // If there's delay
      if ($scope.artists.delay) {
        // Cancel
        $timeout.cancel($scope.artists.delay);
      }
      // Set timeout
      $scope.artists.delay = $timeout(function() {
        // Save photo
        API.put('me/photo/' + $scope.photo.id, {
          title: $scope.photo.title,
          artists: $scope.artists.getIds()
        }).then(function(response) {

        });
      }, 1000); // 1 second delay
    },
    watcher: [],
    delay: null,
    watchPhoto: function() {
      // If there's watcher
      if ($scope.artists.watcher.length) {
        // call
        $scope.artists.watcher[0]();
        $scope.artists.watcher[1]();
        // Remove
        $scope.artists.watcher = [];
      }
      // Do watch
      $scope.artists.watcher.push($scope.$watchCollection('photo.artists', function(current, prev) {
        // Make sure the length doesn't match
        if (current && prev && current.length !== prev.length) {
          // Save
          $scope.artists.save();
        }
      }));
      $scope.artists.watcher.push($scope.$watch('photo.title', function(current, prev) {
        // Make sure not the same
        if (current !== prev) {
          // save
          $scope.artists.save();
        }
      }));
    }
  };

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
      var endpoint = 'artists/' + $state.params.username + '/recommend';
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
      var endpoint = 'artists/' + $state.params.username + '/favorite';
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
      $state.go('map');
    }
  };

  // Set artist
  $scope.artist = {};

  $scope.touch = new Touch();

  $scope.showAll = false;
  $scope.showExhibition = function($index) {
    // Convert
    $scope.artist.exhibitions[$index].active = !!$scope.artist.exhibitions[$index].active;
    // Check if active
    return ($scope.artist.exhibitions[$index].active !== $scope.showAll);
  };

  // Load
  $scope.loadArtist = function(done) {
    // Get
    API.get('artists/' + $state.params.username).then(function(response) {
      // Set data
      var data = response.data;

      // If there's no id
      if (!data._id || !data.id) {
        // Redirect
        $state.go('404');
        return false;
      }

      // Set favorite
      $scope.menu.favorited = data.favorite;
      // Set recommended
      $scope.menu.recommended = data.recommend;

      // Change comment source
      $scope.commentSource = 'artists/' + data.username + '/comments';

      // Set photos
      $scope.photos = (data.album && data.album.photos) ? data.album.photos : [];
      // Sort photos
      $scope.photos.sort(function(a, b) {
        // Return
        return moment(b.created).isAfter(a.created) ? 1 : -1;
      });

      // Set artist
      $scope.artist = {
        id: data._id || data.id || null,
        name: data.name,
        photo: data.photo || null,
        description: data.description,
        websites: data.websites,

        links: data.links,
        publications: [
          /*
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
          */
        ],

        genres: data.genres,

        // Exhibitions
        exhibitions: data.exhibitions,

        feedback: [
          {
            date: '2015-01-08',
            content: 'Review of the present exhibition at HBL: http://www.hbl.fi/128449032875',
            author: {
              name: 'Forum Box',
              website: 'http://forum-box.com'
            }
          },
          {
            date: '2015-01-01',
            content: 'Hevoset Taskussa opening event today at 5pm, welcome!',
            author: {
              name: 'Forum Box',
              website: 'http://forum-box.com'
            }
          },
          {
            date: '2014-12-21',
            content: 'Forum Box was listed as Editor’s Choice venue at  Visit Finland art section. http://www.visitfinland.fi/art/forumbox ',
            author: {
              name: 'Forum Box',
              website: 'http://forum-box.com'
            }
          }
        ]
      };

      /*
      // If there are no images
      if (!$scope.photos.length && !$scope.owner()) {
        // Error
        $state.go('404');
        return false;
      }
      */

    }).catch(function(a, b, c, d) {

      console.log('Error caught');
      console.log(a);
      console.log(b);
      console.log(c);
      console.log(d);

      // Error
      $state.go('404');
    });
  };

  // Load artist
  $scope.loadArtist();
}

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

'use strict';

angular.module('main').controller('MapController', ['$location', '$scope', '$state', 'API', 'MapOptions', 'uiGmapGoogleMapApi', '$timeout', '$window', '$element', 'location', '$q',
  function($location, $scope, $state, API, MapOptions, uiGmapGoogleMapApi, $timeout, $window, $element, location, $q) {

  // Venue types
  $scope.venueTypes = {
    gallery: 'gallery',
    museum: 'museum',
    'public': 'public space',
    other: 'other'
  };

  // Load highlight
  var highlight = null, 
      focusEvent = $location.search().event || '',
      focusVenue = $location.search().venue || '',
      hasFocus = focusEvent || focusVenue;

  /**
   * Overrides Google marker adding label
   */
  var addLabelToMarkers = function(maps, className) {

    maps.Marker.prototype.setLabel = function(label){
      this.label = new MarkerLabel({
        map: this.map,
        marker: this,
        text: label,
        position: this.get('position')
      });
      // Bind position
      maps.event.addListener(this, 'position_changed', function() {
        this.label.set('position', this.get('position'));
      });
    };

    var MarkerLabel = function(options) {
      this.setValues(options);
      this.element = document.createElement('span');
      this.element.className = className;
    };

    MarkerLabel.prototype = angular.element.extend(maps.OverlayView.prototype, {
      onAdd: function() {        
        this.getPanes().overlayImage.appendChild(this.element);
        var self = this;

        maps.event.addListener(this, 'position_changed', function() {
          self.draw();
        });

        // Draw initially
        this.draw();
        // console.log(this);
      },
      draw: function() {
        var text = String(this.get('text'));
        var position = this.getProjection().fromLatLngToDivPixel(this.get('position'));
        var elem = angular.element(this.element);
        // Set style
        elem.html(text).css({
          left: (position.x - (elem.width() / 2)) + 'px',
          top: position.y + 'px'
        });
      }
    });

  };

  $scope.close = function() {
    if ($window.history.length) {
      $window.history.back();
    } else {
      $state.go('landing-now');
    }
  };

  // User's location
  $scope.location = {
    coordinates: null,
    set: function(lat, lng) {
      $scope.location.coordinates = {
        latitude: lat,
        longitude: lng
      };
    }
  };

  // Promises
  var promises = [location.promise, uiGmapGoogleMapApi], focusDeferred = $q.defer();

  // If there's event or venue
  if (hasFocus) {
    // Create new promise
    promises.push(focusDeferred.promise);
  }

  $q.all(promises).then(function() {
    // Position
    var position = new $scope.map.maps.LatLng(location.current.latitude,
                                              location.current.longitude);
    // Set location
    $scope.location.set(location.current.latitude, location.current.longitude);
    // Create marker
    var marker = new $scope.map.maps.Marker({
      position: position, 
      icon: $window.location.origin + root + '/images/marker.png'
    });
    // Add marker
    marker.setMap($scope.map.gmap);

    // If there's highlight
    if (highlight) {
      // Position
      position = new $scope.map.maps.LatLng(highlight.venue.address.coordinates.latitude,
                                            highlight.venue.address.coordinates.longitude);
    }

    // Set center
    $scope.map.gmap.setCenter(position);

    // Initialize directions
    $scope.directions.init();
  });

  $scope.directions = {
    display: null,
    service: null,
    init: function() {
      // Create
      $scope.directions.display = new $scope.map.maps.DirectionsRenderer();
      $scope.directions.service = new $scope.map.maps.DirectionsService();
      // Set map
      $scope.directions.display.setMap($scope.map.gmap);
    },
    request: function(target) {

      if (!$scope.directions.service) {
        return false;
      }

      $scope.directions.service.route({
        origin: new $scope.map.maps.LatLng($scope.location.coordinates.latitude, $scope.location.coordinates.longitude),
        destination: new $scope.map.maps.LatLng(target.latitude, target.longitude),
        travelMode: $scope.map.maps.TravelMode.DRIVING
      }, function(response, status) {

        if (status === $scope.map.maps.DirectionsStatus.OK) {
          $scope.directions.display.setDirections(response);
        }

      });
    }
  };

  $scope.preview = {
    marker: null,
    element: angular.element($element).find('.preview:first'),
    photo: null,
    count: 0,
    current: 0,
    select: function(again) {
      // Set the marker
      var marker = $scope.preview.marker, theName = '';

      if (focusVenue) {
        // Set venue
        var venue = $scope.preview.marker.venue;
        // focusVenue
        $scope.preview.focusVenue = true;
        // Set venue
        $scope.preview.venue = venue;
        $scope.preview.description = venue.description;
        theName = venue.name;
        // If there's photo
        if (venue && venue.album && venue.album.photos && venue.album.photos[0]) {
          // Set it
          $scope.preview.photo = venue.album.photos[0];
        } else {
          // Set empty
          $scope.preview.photo = null;
        }
        // Set distance
        $scope.preview.distance = function() {
          var dist = $scope.preview.marker.distance();
          // If distance is more than 1km
          if (dist >= 1) {
            dist = dist.toFixed(2) + 'km';
          } else {
            dist = Math.floor(dist * 1000) + 'm';
          }
          return dist;
        };
      } else {
        // Exhibition
        var exhibition = $scope.preview.marker.exhibitions[$scope.preview.current];
        // Set properties
        // Set photo
        $scope.preview.photo = (exhibition.gallery && exhibition.gallery.photos && exhibition.gallery.photos[0]) ?
          (root + exhibition.gallery.photos[0].photo.source) : null;
        $scope.preview.name = exhibition.name;
        $scope.preview.permalink = exhibition.permalink;

        // Get artists
        var artists = [];
        for (var i in exhibition.artists) {
          if (exhibition.artists[i]) {
            if (exhibition.artists[i].user && exhibition.artists[i].user.fullname) {
              artists.push(exhibition.artists[i].user.fullname);
            } else if (exhibition.artists[i].nonUser && exhibition.artists[i].nonUser.fullname) {
              artists.push(exhibition.artists[i].nonUser.fullname);
            }
          }
        }

        $scope.preview.artists = artists.join(', ');
        $scope.preview.venue = $scope.preview.marker.venue.name;
        $scope.preview.venuePermalink = $scope.preview.marker.venue.permalink;
        $scope.preview.distance = function() {
          var dist = $scope.preview.marker.distance();
          // If distance is more than 1km
          if (dist >= 1) {
            dist = dist.toFixed(2) + 'km';
          } else {
            dist = Math.floor(dist * 1000) + 'm';
          }
          return dist;
        };
        $scope.preview.venueType = $scope.preview.marker.venue.venueType;
        $scope.preview.venueTypes = $scope.preview.marker.venue.venueTypes;

        if (!$scope.preview.venueTypes.length) {
          $scope.preview.venueTypes = [$scope.preview.venueType];
        }

        $scope.preview.start = exhibition.startDate;
        $scope.preview.end = exhibition.endDate;
        $scope.preview.description = exhibition.description;

        if (exhibition.status === 'open' && marker.status !== 'special') {
          // Set marker as open
          marker.status = 'open';
        }
        if (exhibition.status === 'special') {
          // Set marker as open
          marker.status = 'special';
        }

        theName = exhibition.name;
      }

      // Show again
      $scope.preview.element.addClass('show');
      // Set status
      $scope.map.setMarkerStatus(marker, true);
      angular.element(marker.label.element)
        .removeClass('hide')
        .text(theName);
        
      // Request directions
      // $scope.directions.request(exhibition.venue.address.coordinates);
    },
    prev: function() {
      $scope.preview.current--;
      if ($scope.preview.current < 0) {
        $scope.preview.current = $scope.preview.count - 1;
      }
      $scope.preview.select();
    },
    next: function() {
      $scope.preview.current++;
      if ($scope.preview.current >= $scope.preview.count) {
        $scope.preview.current = 0;
      }
      $scope.preview.select();
    },
    // Active coords
    activeCoords: function() {
      // Return
      return $scope.preview.marker.venue.address.coordinates;
    },
    // Active LatLng
    activeLatLng: function() {
      // Get coords
      var coords = $scope.preview.activeCoords();
      // Return
      return new $scope.map.maps.LatLng(coords.latitude, coords.longitude);
    },
    // Locate
    locate: function() {
      // Pan
      $scope.map.gmap.panTo($scope.preview.activeLatLng());
    },
    // Directions
    directions: function() {
      // Get directions
      $scope.directions.request($scope.preview.activeCoords());
    },
    set: function(marker, eventPermalink) {
      // If already
      if ($scope.preview.marker && $scope.preview.marker.id === marker.id) {
        // Exit
        return false;
      }
      // Set marker
      $scope.preview.marker = marker;
      // Shown
      var shown = $scope.preview.element.hasClass('show');
      // Hide
      $scope.preview.element.removeClass('show');
      // Get element
      $timeout(function() {
        // Set count
        $scope.preview.count = marker.exhibitions.length;
        $scope.preview.current = 0;

        // If there's permalink
        if (eventPermalink) {
          // Loop through exhibitions
          for (var o in marker.exhibitions) {
            // If event match
            if (marker.exhibitions[o].permalink === eventPermalink) {
              // Set as current
              $scope.preview.current = o;
              break;
            }
          }
        }

        // Select
        $scope.preview.select();
      }, shown ? 200 : 1);
    }
  };

  $scope.map = {
    maps: null,
    gmap: null,
    options: MapOptions,
    latitude: 60.173324,
    longitude: 24.941025,
    zoom: 15,
    firstLoaded: false,
    init: function(maps, map) {
      // Set map
      $scope.map.maps = maps;
      $scope.map.gmap = map;
      // Add label
      addLabelToMarkers(maps, 'marker-label');

      $scope.map.loaded(map);
    },
    loaded: function(map) {
      // Populate
      if (!$scope.map.firstLoaded) {
        $scope.map.populate();
        // Get center
        var center = $scope.map.gmap.getCenter();

        // If there's no location
        if (!$scope.location.coordinates) {
          // Set user location
          $scope.location.set(center.lat(), center.lng());
        }
      }
      $scope.map.firstLoaded = true;
    },
    change: function(map) {
      // Populate
      // $scope.map.populate();
    },
    markers: [],
    userMarker: {},
    getMarkerById: function(id, markers) {
      // If there's no markers
      if (!markers) {
        // Get from list
        markers = $scope.map.markers;
      }
      // Find marker by id
      for (var i in markers) {
        if (markers[i].id === id) {
          return markers[i];
        }
      }
      return false;
    },
    setMarkerStatus: function(marker, active) {
      marker.active = !!active;
      marker.setIcon($window.location.origin + root + '/images/marker-' + marker.status + (active ? '-active' : '') + '.png');
    },
    clickMarker: function() {
      // Select marker
      $scope.map.selectMarker(this);
    },
    selectMarker: function(marker, eventPermalink) {
      // Select all
      for (var i in $scope.map.markers) {
        // Skip
        if ($scope.map.markers[i].id === marker.id) {
          continue;
        }
        // Deactivate
        $scope.map.setMarkerStatus($scope.map.markers[i], false);
        // Add class
        angular.element($scope.map.markers[i].label.element).addClass('hide');
      }
      // Set preview
      $scope.preview.set(marker, eventPermalink);
    },
    clearMarkers: function() {
      if ($scope.map.markers) {
        for (var i in $scope.map.markers) {
          // Set map
          $scope.map.markers[i].setMap(null);
        }
      }
      // Empty
      $scope.map.markers = [];
      return $scope.map;
    },
    populating: null,
    populate: function() {

      if ($scope.map.populating) {
        // Cancel
        $timeout.cancel($scope.map.populating);
      }

      $scope.map.populating = $timeout(function() {
        var bounds = $scope.map.gmap.getBounds();
        var center = $scope.map.gmap.getCenter();

        var lat = center.lat(), lng = center.lng();

        var endpoint = 'events', args = {
          // sw: bounds.getSouthWest().toString().replace('(', '').replace(')', '').replace(' ', ''),
          // ne: bounds.getNorthEast().toString().replace('(', '').replace(')', '').replace(' ', ''),
          date: 'today',
          limit: 1000
        };
        // If to show venue
        if (focusVenue) {
          // Set endpoint
          endpoint = 'venues/' + focusVenue;
          args = {};
        }

        API.get(endpoint, args).then(function(response) {

          // Clear markers first
          $scope.map.clearMarkers();

          // Set markers
          var markers = [], hasToFocus = false;
          // Edit venue types
          var major = ['gallery', 'museum', 'public', 'other'];
          var venue = null, marker = null, position = null, x = 0;

          // If there's venue
          if (focusVenue) {

            if (response.data) {
              venue = response.data;
              // Position
              position = new $scope.map.maps.LatLng(venue.address.coordinates.latitude,
                                                        venue.address.coordinates.longitude);
              // Create marker
              marker = new $scope.map.maps.Marker({
                position: position, 
                icon: $window.location.origin + root + '/images/marker-closed.png',
                label: venue.name
              });
              // Loop through types
              for (x = venue.venueTypes.length - 1; x >= 0; x--) {
                // Remove if major
                if (major.indexOf(venue.venueTypes[x]) >= 0) {
                  venue.venueTypes.splice(x, 1);
                }
              }

              // Attach venue
              marker.venue = venue;
              marker.id = venue.id;
              // Attach empty exhibition
              marker.exhibitions = [];
              marker.active = false;
              // Set marker as open
              marker.status = venue.status;
              marker.setIcon($window.location.origin + root + '/images/marker-' + venue.status + '.png');

              /* jshint ignore:start */
              // Create dist calc
              marker.distance = function() {
                // Return
                return location.distance(this.venue.address.coordinates);
              };
              /* jshint ignore:end */

              // Hide label
              angular.element(marker.label.element).addClass('hide');

              // Add to markers
              markers.push(marker);
              // Set click
              marker.addListener('click', $scope.map.clickMarker);
              // Set venue as highlight
              highlight = marker;
              hasToFocus = true;

            }

          } else {
            // Loop through
            if (response.data.data) {
              for (var i in response.data.data) {

                // Randomize
                // var status = ['open', 'closed', 'special'][Math.floor(Math.random() * 3)];
                // Get exhibition
                var exhibition = response.data.data[i];
                venue = exhibition.venue;

                // Check if venue is already in markers
                marker = $scope.map.getMarkerById(venue.id, markers);

                // If there's no marker
                if (!marker) {
                  // Position
                  position = new $scope.map.maps.LatLng(venue.address.coordinates.latitude,
                                                            venue.address.coordinates.longitude);
                  // Create marker
                  marker = new $scope.map.maps.Marker({
                    position: position, 
                    icon: $window.location.origin + root + '/images/marker-closed.png',
                    label: exhibition.name
                  });
                  // Loop through types
                  for (x = venue.venueTypes.length - 1; x >= 0; x--) {
                    // Remove if major
                    if (major.indexOf(venue.venueTypes[x]) >= 0) {
                      venue.venueTypes.splice(x, 1);
                    }
                  }

                  // Attach venue
                  marker.venue = venue;
                  marker.id = venue.id;
                  // Attach empty exhibition
                  marker.exhibitions = [];
                  marker.active = false;
                  marker.status = 'closed';

                  /* jshint ignore:start */
                  // Create dist calc
                  marker.distance = function() {
                    // Return
                    return location.distance(this.venue.address.coordinates);
                  };
                  /* jshint ignore:end */

                  // Hide label
                  angular.element(marker.label.element).addClass('hide');

                  // Add to markers
                  markers.push(marker);
                  // Set click
                  marker.addListener('click', $scope.map.clickMarker);
                }


                // If there's focusEvent
                if (focusEvent) {
                  // If event matches
                  if (focusEvent === exhibition.permalink) {
                    // Set its venue as highlight
                    highlight = marker;
                    hasToFocus = true;
                  }
                } else if (focusVenue) {
                  // If the venue matches
                  if (focusVenue === exhibition.venue.permalink) {
                    // Set venue as highlight
                    highlight = marker;
                    hasToFocus = true;
                  }
                }


                // Add exhibition
                marker.exhibitions.push(exhibition);
                if (exhibition.status === 'open' && marker.status !== 'special') {
                  // Set marker as open
                  marker.status = 'open';
                  marker.setIcon($window.location.origin + root + '/images/marker-open.png');
                }
                if (exhibition.status === 'special') {
                  // Set marker as open
                  marker.status = 'special';
                  marker.setIcon($window.location.origin + root + '/images/marker-special.png');
                }
              }
            }
          }

          // Sort marker 
          markers.sort(function(a, b) {
            // Get distance of a from center
            var distA = location.distance({ latitude: lat, longitude: lng }, a.venue.address.coordinates);
            var distB = location.distance({ latitude: lat, longitude: lng }, b.venue.address.coordinates);
            // Return
            return distA - distB;
          });

          // Loop through markers
          for (var j in markers) {
            // Drop marker
            $scope.map.dropMarker(markers[j]);
          }

        });
      }, 1000);

    },

    queuedMarkers: [],
    droppingMarker: false,
    dropMarker: function(marker) {
      // If there's marker
      if (marker) {
        // Make sure map is null
        marker.setMap(null);
        // Just add to queue
        $scope.map.queuedMarkers.push(marker);
      }
      // If no longer dropping
      if (!$scope.map.droppingMarker) {
        // Get next marker
        var nextMarker = $scope.map.queuedMarkers[0];
        // If there's any
        if (nextMarker) {
          // Set dropping
          $scope.map.droppingMarker = true;
          // Add marker
          nextMarker.setMap($scope.map.gmap);
          // After setting map, set map for label as well
          nextMarker.label.setMap($scope.map.gmap);
          nextMarker.setAnimation($scope.map.maps.Animation.DROP);
          // Add to markers
          $scope.map.markers.push(nextMarker);
          // Remove from queue
          $scope.map.queuedMarkers = $scope.map.queuedMarkers.slice(1);
          // Wait
          $timeout(function() {
            // Set dropping
            $scope.map.droppingMarker = false;
            // Call dropmarker
            $scope.map.dropMarker();
          }, 20);
        } else {
          // If there's highlight
          if (highlight) {
            // Highlight the marker
            $scope.map.selectMarker(highlight, focusEvent);
            // Resolve
            focusDeferred.resolve(highlight);
          } else {
            // Preview first
            $scope.map.selectMarker($scope.map.markers[0]);
          }
        }
      }
    }

  };

}]);
'use strict';

// Setting up route
angular.module('main')
	.constant('APP_KEYS', {
        cookieLangKey: 'artAdvisor-userLang'
    })
	.config(mainConfig)
	.run(initMain);

/////////////////////////////////////////////////

mainConfig.$inject = [
	'$stateProvider',
	'$urlRouterProvider',
	'uiGmapGoogleMapApiProvider',
	'tagsInputConfigProvider'
];

function mainConfig($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider, tagsInputConfigProvider) {
	// Redirect to home view when route not found
	$urlRouterProvider.otherwise('/landing');

	// Routes
	$stateProvider
		/**
		 * Splash Page
		 */
		.state('splash', {
			url: '/',
			templateUrl: root + '/modules/main/views/splash.client.view.html'
		})
		/**
		 * Authentication Page
		 */
		.state('authentication', {
			url: '/authentication?action&message&next',
			templateUrl: root + '/modules/main/views/authentication.client.view.html',
			filters: ['notLoggedIn']
		})
		/**
		 * Forgot Password Page
		 */
		.state('forgot-password', {
			url: '/forgot-password?email&code',
			templateUrl: root + '/modules/main/views/forgot-password.client.view.html',
			filters: ['notLoggedIn']
		})
		/**
		 * Settings Page
		 */
		.state('settings', {
			url: '/settings',
			templateUrl: root + '/modules/main/views/settings.client.view.html'
		})
		/**
		 * Feedback Page
		 */
		.state('feedback', {
			url: '/feedback',
			templateUrl: root + '/modules/main/views/feedback.client.view.html'
		})
		/**
		 * Report Page
		 */
		.state('report', {
			url: '/report?url',
			templateUrl: root + '/modules/main/views/report.client.view.html'
		})
		/**
		 * Invite Page
		 */
		.state('invite', {
			url: '/invite',
			templateUrl: root + '/modules/main/views/invite.client.view.html'
		})
		/**
		 * About & Terms Page
		 */
		.state('about-terms', {
			url: '/about-terms',
			templateUrl: root + '/modules/main/views/about-terms.client.view.html'
		})
		/**
		 * Privacy Policy Page
		 */
		.state('privacy-policy', {
			url: '/privacy-policy',
			templateUrl: root + '/modules/main/views/privacy-policy.client.view.html'
		})
		/**
		 * Profile Page
		 */
		.state('profile', {
			url: '/profile',
			templateUrl: root + '/modules/main/views/profile.client.view.html'
		})
		/**
		 * Landing pages
		 */
		.state('landing-artview', {
			url: '/landing/artview',
			templateUrl: root + '/modules/main/views/landing/artview.client.view.html'
		})
		.state('landing-artcache', {
			url: '/landing/artcache',
			templateUrl: root + '/modules/main/views/landing/artcache.client.view.html'
		})
		.state('landing-now', {
			url: '/landing',
			templateUrl: root + '/modules/main/views/landing/now.client.view.html'
		})
		.state('landing-favorites', {
			url: '/landing/favorites',
			templateUrl: root + '/modules/main/views/landing/favorites.client.view.html'
		})
		.state('landing-lastchance', {
			url: '/landing/lastchance',
			templateUrl: root + '/modules/main/views/landing/lastchance.client.view.html'
		})
		/**
		 * Venue Page
		 */
		.state('venue-create', {
			url: '/venue/create',
			templateUrl: root + '/modules/main/views/venue/create.client.view.html',
			filters: ['loggedIn']
		})
		.state('venue', {
			url: '/venue/:permalink',
			templateUrl: root + '/modules/main/views/venue.client.view.html'
		})
		.state('venue-edit', {
			url: '/venue/:permalink/edit',
			templateUrl: root + '/modules/main/views/venue/edit.client.view.html',
			filters: ['loggedIn']
		})
		/**
		 * Exhibition Page
		 */
		.state('exhibition-create', {
			// Name this event per client specs
			url: '/event/create?venue',
			templateUrl: root + '/modules/main/views/exhibition/create.client.view.html',
			filters: ['loggedIn']
		})
		.state('exhibition', {
			// Name this event per client specs
			url: '/event/:permalink',
			templateUrl: root + '/modules/main/views/exhibition.client.view.html'
		})
		.state('exhibition-edit', {
			// Name this event per client specs
			url: '/event/:permalink/edit',
			templateUrl: root + '/modules/main/views/exhibition/edit.client.view.html',
			filters: ['loggedIn']
		})
		/**
		 * Artist Page
		 */
		.state('artist', {
			url: '/artist/:username',
			templateUrl: root + '/modules/main/views/artist.client.view.html'
		})
		/**
		 * Search Page
		 */
		.state('search', {
			url: '/search?q',
			templateUrl: root + '/modules/main/views/search.client.view.html'
		})
		/**
		 * Map Page
		 */
		.state('map', {
			url: '/map?event&venue',
			templateUrl: root + '/modules/main/views/map.client.view.html'
		})
		/**
		 * Art Cache
		 */
		.state('artcache', {
			url: '/artcache',
			templateUrl: root + '/modules/main/views/artcache.client.view.html'
		})

		/**
		 * 404 Page
		 */
		.state('404', {
			url: '/404',
			templateUrl: root + '/modules/main/views/404.client.view.html'
		});

    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyBMV_9vKwdNvtkqIOH0CCnhJgumS1a-AUw', // 'AIzaSyAecR5n1go6Obe5oKJ6lWsFXnr_0wEE7vc',
      v: '3.17',
      libraries: 'geometry'
    });

    tagsInputConfigProvider.setActiveInterpolation('tagsInput', { placeholder: true });

}

initMain.$inject = [
	'$rootScope',
	'$window',
	'$location',
	'Authentication',
	'$state',
	'LangSvc',
	'API',
	'moment',
	'amMoment',
];

function initMain($rootScope, $window, $location, Authentication, $state, LangSvc, API, moment, amMoment) {
	var statesToCheckLang = ['splash'];

	// Finnish timezone
	// moment().utcOffset('+0300');
	// amMoment.changeTimezone('+0300');

	// console.log(moment().utcOffset());

	$rootScope.$on('$stateChangeStart', function(event, next) {
		var userLang = LangSvc.getLanguage();

		if (Authentication.token) {
		    if (_.indexOf(statesToCheckLang, next.name) >= 0) {
                event.preventDefault();
                // Redirect to landing page
			    $state.go('landing-now');
            }
		} else {
		  	if (userLang) {
		  		if (_.indexOf(statesToCheckLang, next.name) >= 0) {
		  			event.preventDefault();
			  		$state.go('authentication');
			  	}
		  	} else {
		  		if (_.indexOf(statesToCheckLang, next.name) < 0) {
		  			event.preventDefault();
		  			$state.go('splash');
		  		}
		  	}
		}
    });

	$rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
		$rootScope.previousState = fromState.name;
		$rootScope.$broadcast('stateChanged', {
			fromState: fromState,
			fromParams: fromParams,
			toState: toState,
			toParams: toParams
		});
	});

	// On load
	$rootScope.$on('$viewContentLoaded', function($event) {
		// Send
		$window.ga('send', 'pageview', {
			page: $location.url()
		});
	});

	$rootScope.scrollTop = function() {
		$window.scrollTo(0, 0);
	};

	$rootScope.$currentCity = null;
	// On change
	$rootScope.$on('$changeCity', function(e, city) {
		// Set it
		$rootScope.$currentCity = city || null;
		// If there's id
		if ($rootScope.$currentCity &&
				$rootScope.$currentCity._id) {
			// Set it
			API.put('location/current', {
				id: $rootScope.$currentCity._id
			}).then(function(response) {
				// console.log(response.data);
			});
		}
	});

	angular.element($window.document).on('click', function(e) {
		// Body click
		$rootScope.$broadcast('bodyClick', e);
	});

	var getCurrentDevice = function() {
		// Set wnd
		var wnd = angular.element(window);
		// Get window width
		var width = wnd.width(), newDevice = null;

		if (width <= 725) {
			newDevice = 'mobile';
		} else if (width >= 726 && width <= 1110) {
			newDevice = 'tablet';
		} else if (width >= 1111 && width <= 1420) {
			newDevice = 'desktop';
		} else if (width >= 1421 && width <= 1620) {
			newDevice = 'largeDesktop';
		} else if (width >= 1621) {
			newDevice = 'extraLargeDesktop';
		}
		// Return
		return newDevice;
	};

	angular.element(window).resize(function() {

		$rootScope.$broadcast('windowResized', $window);

		// Get new device
		var newDevice = getCurrentDevice();
		// Check if device changed
		if (device !== newDevice) {
			// Set new device
			device = newDevice;
			// Trigger event
			$rootScope.$broadcast('deviceChanged', device);
		}

	});

	// Update lang
	var updateBodyLang = function() {
		angular.element('body:first').removeClass('en fi se de').addClass($window.lang);
	};

	$rootScope.getLang = function() {
		return $window.lang;
	};

	// Brick width
	$rootScope.brickWidth = function() {
		// Return
		return ({
	    extraLargeDesktop: 296,
	    largeDesktop: 326,
	    desktop: 339,
	    tablet: 328,
	    mobile: 270
		})[device];
	};

	$rootScope.$watch('getLang()', function(current, prev) {
		if (prev !== current) {
			// Lang changed
			updateBodyLang();
		}
	});
	// Update body lang
	updateBodyLang();

	// Set current device
	device = getCurrentDevice();

  	// Extend jQuery easing
  	jQuery.extend(jQuery.easing, {
    	easeOutQuint: function (x, t, b, c, d) {
      		return c*((t=t/d-1)*t*t*t*t + 1) + b;
    	}
  	});
}
