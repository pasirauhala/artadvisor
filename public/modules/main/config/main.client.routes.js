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
