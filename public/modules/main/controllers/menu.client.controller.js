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
