'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'mean';
	var applicationModuleVendorDependencies = [
		'ngResource', 
		'ngAnimate', 
		'ui.router', 
		'ui.bootstrap', 
		'ui.utils', 
		'ngTable', 
		'ngFileUpload', 
		'angularMoment'
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
ApplicationConfiguration.registerModule('admin');

'use strict';

// Setting up route
angular.module('admin').config(['$stateProvider', '$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		// Redirect to home view when route not found
		$urlRouterProvider.otherwise('/');

		var routes = ['dashboard', 'users', 'artists', 'venues', 'events', 'faker'];

		for (var i in routes) {
			// Route
			var view = routes[i];
			if (view === 'events') {
				view = 'exhibitions';
			}
			$stateProvider
				.state(routes[i], {
					url: '/' + ((routes[i] === 'dashboard') ? '' : routes[i]),
					templateUrl: root + '/modules/admin/views/'+view+'.client.view.html'
				});
		}

		// Create route for single venue
		$stateProvider
			.state('venue', {
				url: '/venues/:permalink',
				templateUrl: root + '/modules/admin/views/venue.client.view.html'
			});
	}
]);
'use strict';

// API Service
angular.module('admin').service('API', ['$http', '$state', '$q', 'Authentication', '$window', function($http, $state, $q, Authentication, $window) {
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
  var handleException = function(exception) {
    // Select group
    switch (exception.group) {
      // If general
      case 'general':
        // Alert
        alert(exception.message);
        break;
      // If unauthorized
      case 'unauthorized':
        // Redirect to login page with error message
        /* $state.go('authentication', {
          action: 'login',
          message: exception.message
        }); */
        $window.location = '/authentication?next=/admin';
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
        deferred.reject(handleException(response.data.exception));
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

// Authentication service for token
angular.module('admin').factory('Authentication', ['$window', '$location', function($window, $location) {
  // If there's no token
  if (!$window.token || !$window.admin) {
    $window.location = '/authentication?next=/admin';
    return { token: null };
  }
  // Return token
  return {
    token: $window.token
  };
}]);

'use strict';

angular.module('admin').controller('HeaderController', ['$scope', '$state', 'Authentication', 'API', '$window',
	function($scope, $state, Authentication, API, $window) {
		//$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		//$scope.menu = Menus.getMenu('topbar');

		$scope.$state = $state;

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
			$scope.isCollapsed = false;
			$scope.$state = toState;
		});

		$scope.menu = {
			active: function(name) {
				// If same name with state
				if ($scope.$state.name === name) {
					// Return true
					return true;
				}
				// Allowed
				var allowed = {
					'venues': ['venue']
				};
				// If allowed
				return (allowed[name] && allowed[name].indexOf($scope.$state.name) >= 0);
			},
			name: function(index) {
				return this.list[index].name;
			},
			list: [
				{
					name: 'dashboard',
					title: 'Dashboard'
				},
				{
					name: 'users',
					title: 'Users'
				},
				{
					name: 'artists',
					title: 'Artists'
				},
				{
					name: 'venues',
					title: 'Venues'
				},
				{
					name: 'events',
					title: 'Events'
				},
				{
					name: 'faker',
					title: 'Faker'
				},
				{
					name: 'logout',
					title: 'Logout',
					action: function() {
						$scope.logout();
					},
					link: true
				}
			]
		};

    /**
     * Logout
     */
    $scope.logout = function() {
      // Do logout
      API.delete('authenticate/logout')
        .then(function(response) {
          // Empty token
          Authentication.token = null;
          // Redirect
          $window.location = '/authentication';
        });
    };

	}
]);
'use strict';

angular.module('admin').controller('DashboardController', ['$scope', 'Authentication', 'API',
	function($scope, Authentication, API) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
    $scope.user = {};

    API.get('me').then(function(response) {
      $scope.user = response.data;
    });

    // Summary
    $scope.summary = {};

    // Get summary
    API.get('summary').then(function(response) {
      // Set summary
      $scope.summary = response.data;
    });
	}
]);
'use strict';

angular.module('admin').controller('UsersController', UsersController);

UsersController.$inject = ['$scope', '$resource', 'NgTableParams', 'Authentication', 'API', '$window'];

function UsersController($scope, $resource, NgTableParams, Authentication, API, $window) {
  // This provides Authentication context.
  $scope.authentication = Authentication;

  // Set users
  $scope.users = [];
  // Set count
  $scope.count = 0;

  // Update users
  $scope.getUsers = function(filters, start, limit, done) {
    // Get users
    API.get('users', angular.extend({
        start: start,
        limit: limit
      }, filters)).then(function(response) {
        // Set data
        var data = response.data;
        // Set users
        $scope.users = data.data;
        $scope.count = data.count;
        // Done
        if (done) done($scope.users, $scope.count);
      });
  };

  function searchFilter(list, filters) {
  	var usersList = _.filter(list, function(user) {
  		var results = [];

  		_.forEach(filters, function(searchQ, k) {
              var q = new RegExp(searchQ, 'i'),
              	res = -1;

              if (k === 'name') {
    			res = user.name.full.search(q);
    		} else if (k === 'username') {
    			res = user.username.search(q);
    		}

    		if (res >= 0) {
  				results.push(res);
  			}
          });

          return (_.size(results) === _.size(filters));
      });

      return usersList;
  }

  /* jshint ignore:start */
  // Table params
  $scope.table = new NgTableParams({
      page: 1,
      count: 10
  }, {
      getData: function($defer, params) {
          // Count
          var count = params.count(), filter = params.filter(), filters = {};

          ['name', 'username'].forEach(function(f) {
            // If there's filter
            if (filter && filter[f]) {
              // Set to filters
              filters[f] = filter[f];
            }
          });

          // Get users
          $scope.getUsers(filters, (params.page() - 1) * count, count, function(data, dataCount) {
            /*
        		if (dataCount > 0 && !_.isEmpty(params.filter())) {
            	data = searchFilter(data, params.filter());
            	$scope.table.total(_.size(data));
	            $defer.resolve(data);
            } else {
            */
          	// Set count
            $scope.table.total(dataCount);
            $defer.resolve(data);
            // }
          });
      }
  });
  /* jshint ignore:end */

  $scope.isAdmin = function(user) {
    // Return
    return user.roles.indexOf('admin') >= 0;
  };

  $scope.updatingUser = false;

  $scope.setUserRole = function(user, admin) {

    if ($scope.updatingUser) {
      return false;
    }
    // Get admin
    var index = user.roles.indexOf('admin');
    if (admin) {
      if (index < 0) {
        user.roles.push('admin');
      }
    } else {
      if (index >= 0) {
        user.roles.splice(index, 1);
      }
    }
    $scope.updatingUser = true;
    // Update user
    API.put('users/' + user.username, { user: user }).then(function(response) {
      // Do nothing
      $scope.updatingUser = false;
    });
  };

  $scope.isMe = function(user) {
    // Return
    return $window.user_id === user._id;
  };

  // Delete
  $scope.delete = function(user) {

      if (!confirm('Are you sure you want delete "' + user.fullname + '"?\n\nPress OK to proceed')) {
          return false;
      }

      // Updating
      $scope.updatingUser = true;

      API.delete('users/' + user.username).then(function(response) {

          // Reset
          $scope.updatingUser = false;
          // Reload table
          $scope.table.reload();

          if (!$scope.$$phase) {
              $scope.$apply();
          }
      });

  };
}

'use strict';

angular.module('admin').controller('ArtistsController', ArtistsController);

ArtistsController.$inject = ['$scope', '$resource', 'NgTableParams', 'Authentication', '$window', 'API'];

function ArtistsController($scope, $resource, NgTableParams, Authentication, $window, API) {
	// This provides Authentication context.
	$scope.authentication = Authentication;

    var artists = $resource('/api/artists');

    // Set artists
    $scope.artists = [];
    // Set count
    $scope.count = 0;

    // Update artists
    $scope.getArtists = function(filters, start, limit, done) {
        // Get artists
        artists.get(angular.extend({
            start: start,
            limit: limit
        }, filters), function(json) {
            // Set artists
            $scope.artists = json.data;
            $scope.count = json.count;
            // Done
            if (done) done($scope.artists, $scope.count);
         });
    };

    function searchFilter(list, filters) {
    	var artistList = _.filter(list, function(artist) {
    		var results = [];

    		_.forEach(filters, function(searchQ, k) {
                var q = new RegExp(searchQ, 'i'),
                	res = -1;

                if (k === 'name') {
	    			res = artist.name.full.search(q);
	    		} else if (k === 'username') {
	    			res = artist.username.search(q);
	    		}

	    		if (res >= 0) {
    				results.push(res);
    			}
            });

            return (_.size(results) === _.size(filters));
        });

        return artistList;
    }

    /* jshint ignore:start */
    // Table params
    $scope.table = new NgTableParams({
        page: 1,
        count: 10
    }, {
        getData: function($defer, params) {
            // Count
            var count = params.count(), filter = params.filter(), filters = {};

            ['name', 'username'].forEach(function(f) {
                // If there's filter
                if (filter && filter[f]) {
                  // Set to filters
                    filters[f] = filter[f];
                }
            });

            // Get artists
            $scope.getArtists(filters, (params.page() - 1) * count, count, function(data, dataCount) {
                /*
                if (dataCount > 0 && !_.isEmpty(params.filter())) {
	            	data = searchFilter(data, params.filter());
	            	$scope.table.total(_.size(data));
		            $defer.resolve(data);
	            } else {
                */
            	// Set count
                $scope.table.total(dataCount);
                $defer.resolve(data);
	            //}
            });
        }
    });
    /* jshint ignore:end */

    $scope.updatingArtist = false;

    $scope.isMe = function(user) {
      // Return
      return $window.user_id === user._id;
    };

    // Delete
    $scope.delete = function(artist) {

        if (!confirm('Are you sure you want delete "' + artist.fullname + '"?\n\nPress OK to proceed')) {
            return false;
        }

        // Updating
        $scope.updatingArtist = true;

        API.delete('artists/' + artist.username).then(function(response) {

            // Reset
            $scope.updatingArtist = false;
            // Reload table
            $scope.table.reload();

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

    };
}

'use strict';

angular.module('admin').controller('VenuesController', VenuesController);

VenuesController.$inject = ['$scope', '$resource', 'NgTableParams', 'Authentication', '$q', 'API'];

function VenuesController($scope, $resource, NgTableParams, Authentication, $q, API) {
	// This provides Authentication context.
	//$scope.authentication = Authentication;

    var venues = $resource('/api/venues');

    // Set venues
    $scope.venues = [];
    // Set count
    $scope.count = 0;

    // Update venues
    $scope.getVenues = function(filters, start, limit, done) {
        // Get venues
        venues.get(angular.extend(filters, {
            start: start,
            limit: limit
        }), function(json) {
            // Set venues
            $scope.venues = json.data;
            $scope.count = json.count;
            // Done
            if (done) done($scope.venues, $scope.count);
        });
    };

    function searchFilter(list, filters) {
    	var venuesList = _.filter(list, function(venue) {
    		var results = [];

    		_.forEach(filters, function(searchQ, k) {
                var q = new RegExp(searchQ, 'i'),
                	res = -1;

                if (k === 'name') {
	    			res = venue.name.search(q);
	    		} else if (k === 'address') {
	    			res = venue.address.full.search(q);
	    		} else if (k === 'owner') {
	    			res = venue.owner.name.full.search(q);
	    		}

	    		if (res >= 0) {
    				results.push(res);
    			}
            });

            return (_.size(results) === _.size(filters));
        });

        return venuesList;
    }

    /* jshint ignore:start */
    // Table params
    $scope.table = new NgTableParams({
        page: 1,
        count: 10
    }, {
        getData: function($defer, params) {
            // Count
            var count = params.count(), filter = params.filter(), filters = {};

            ['name', 'address', 'owner'].forEach(function(f) {
                // If there's filter
                if (filter && filter[f]) {
                  // Set to filters
                  filters[f] = filter[f];
                }
            });
            
            // Get venues
            $scope.getVenues(filters, (params.page() - 1) * count, count, function(data, dataCount) {
                /*
                if (dataCount > 0 && !_.isEmpty(params.filter())) {
	            	data = searchFilter(data, params.filter());
	            	$scope.table.total(_.size(data));
		            $defer.resolve(data);
	            } else {
                */
            	// Set count
                $scope.table.total(dataCount);
                $defer.resolve(data);
	            //}
            });
        }
    });
    /* jshint ignore:end */

    $scope.updatingVenue = false;

    // Check active events
    $scope.checkForActiveEvents = function(venue) {
        var deferred = $q.defer();

        API.get('venues/' + venue.permalink).then(function(response) {
            //
            if (response.data && response.data.exhibitions) {
                // Has active
                var hasActive = false;
                // Loop
                for (var i in response.data.exhibitions) {
                    // If there's active
                    if (response.data.exhibitions[i].active) {
                        // Reject
                        hasActive = true;
                        break;
                    }
                }
                // If has active
                if (hasActive) {
                    // Reject
                    deferred.reject();
                } else {
                    deferred.resolve(response.data);
                }
            }

        });

        // Return
        return deferred.promise;
    };

    // Delete
    $scope.delete = function(venue) {

        // Check
        $scope.checkForActiveEvents(venue).then(function() {

            if (!confirm('Are you sure you want to delete this venue?\n\nPress OK to proceed')) {
                return false;
            }
            // Updating
            $scope.updatingVenue = true;

            API.delete('venues/' + venue.permalink).then(function(response) {

                // Reset
                $scope.updatingVenue = false;
                // Reload table
                $scope.table.reload();

                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });

        }).catch(function() {
            // Error
            alert('Cannot delete venue. This is currently used in active events');
        });

    };
}

'use strict';

angular.module('admin').controller('VenueController', ['$scope', '$resource', '$state', 'Upload', 'Authentication',
  function($scope, $resource, $state, Upload, Authentication) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    var venue = $resource('/api/venues/:permalink', {
      permalink: $state.params.permalink
    });

    $scope.venue = {};
    // Get venue
    $scope.loadVenue = function(done) {
      // Get
      venue.get(null, function(data) {
        $scope.venue = data;
        // Done
        if (done) done($scope.venue);
      });
    };

    // Upload count
    $scope.uploadCount = 0;
    // Upload
    $scope.upload = function(files) {
      // Set jQuery
      var elem = angular.element;
      // If there are files
      if (files && files.length) {
        // File wrapper
        var wrap = elem('.page.venue:first .file:first');
        // Loop through files
        for (var i = 0; i < files.length; i++) {
          // Set file
          var file = files[i];
          // Increment upload count
          $scope.uploadCount++;
          // Create an uploader
          var uploading = elem('<div>')
                            .addClass('uploading')
                            .attr('id', 'uploading-' + $scope.uploadCount)
                            .append(elem('<div>').addClass('filename').text('Uploading ' + file.name))
                            .append(
                              elem('<div>').addClass('progress')
                                .append(elem('<div>').addClass('percent')));

          // Append to file
          wrap.append(uploading);

          // Set upload id
          file.uploadId = $scope.uploadCount;

          /* jshint ignore:start */
          // Do upload
          Upload.upload({
            url: '/api/upload',
            fields: { },
            file: file
          }).progress(function(evt) {
            var percent = (evt.loaded / evt.total) * 100;
            // Get upload progress
            var uploadProgress = elem('#uploading-' + evt.config.file.uploadId);
            // Set progress
            uploadProgress.find('.progress:first .percent:first').css({
              width: percent + '%'
            });
          }).success(function(data, status, headers, config) {
            // Get upload progress
            var uploadProgress = elem('#uploading-' + config.file.uploadId);
            // Remove
            uploadProgress.stop().fadeOut(200, function() {
              this.remove();
            });
          });
          /* jshint ignore:end */

          // Show uploading
          wrap.find('.uploading:last').show(200);
        }
      }
    };

    $scope.loadVenue();
  }
]);
'use strict';

angular.module('admin').controller('ExhibitionsController', ExhibitionsController);

ExhibitionsController.$inject = ['$scope', 'API', '$resource', 'NgTableParams', 'Authentication'];

function ExhibitionsController($scope, API, $resource, NgTableParams, Authentication) {
// This provides Authentication context.
//$scope.authentication = Authentication;

    var exhibitions = $resource('/api/events');

    // Set exhibitions
    $scope.exhibitions = [];
    // Set count
    $scope.count = 0;

    // Update exhibitions
    $scope.getExhibitions = function(filters, start, limit, done) {
        // Get exhibitions
        exhibitions.get(angular.extend({
            start: start,
            limit: limit
        }, filters), function(json) {
            // Set exhibitions
            $scope.exhibitions = json.data;
            $scope.count = json.count;
            // Done
            if (done) done($scope.exhibitions, $scope.count);
         });
    };

    function searchFilter(list, filters) {
    	var exhibits = _.filter(list, function(exhibit) {
    		var results = [];

    		_.forEach(filters, function(searchQ, k) {
                var q = new RegExp(searchQ, 'i'),
                	res = -1;

                if (k === 'name') {
	    			res = exhibit.name.search(q);
	    		} else if (k === 'description') {
	    			res = exhibit.description.search(q);
	    		} else if (k === 'artist') {
	    			var artistNames = [];

	    			_.forEach(exhibit.artists, function(n) {
	    				if (n.user) {
	    					artistNames.push(n.user.fullname);
	    				} else if (n.nonUser) {
	    					artistNames.push(n.nonUser.fullname);
	    				}
		            });

		            res = artistNames.join(' ').search(q);
	    		} else if (k === 'venue') {
	    			res = exhibit.venue.name.search(q);
	    		}

	    		if (res >= 0) {
    				results.push(res);
    			}
            });

            return (_.size(results) === _.size(filters));
        });

        return exhibits;
    }

    // Table params
    $scope.table = new NgTableParams({
        page: 1,
        count: 10
    }, {
    	getData: function($defer, params) {
        	// Count
        	var count = params.count(), filter = params.filter(), filters = {};

            ['name', 'description', 'artist', 'venue'].forEach(function(f) {
                // If there's filter
                if (filter && filter[f]) {
                  // Set to filters
                  filters[f] = filter[f];
                }
            });
            
        	// Get exhibitions
            $scope.getExhibitions(filters, (params.page() - 1) * count, count, function(data, dataCount) {
                /*
                if (dataCount > 0 && !_.isEmpty(params.filter())) {
	            	data = searchFilter(data, params.filter());
	            	$scope.table.total(_.size(data));
		            $defer.resolve(data);
	            } else {
                */
            	// Set count
                $scope.table.total(dataCount);
                $defer.resolve(data);
	            //}
            });
        }
    });

    $scope.updatingExhibition = false;

    // Delete
    $scope.delete = function(exhibition) {

        if (!confirm('Are you sure you want to delete this event?\n\nPress OK to proceed')) {
            return false;
        }

        // Updating
        $scope.updatingExhibition = true;

        API.delete('events/' + exhibition.permalink).then(function(response) {

            // Reset
            $scope.updatingExhibition = false;
            // Reload table
            $scope.table.reload();

            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
    };
}

'use strict';

angular.module('admin').controller('FakerController', ['$scope', '$http', 'Authentication', 'API',
	function($scope, $http, Authentication, API) {
		// This provides Authentication context.
		//$scope.authentication = Authentication;

		// All models
		$scope.models = ['artist', 'venue', 'exhibition', 'album', 'photo', 'gallery', 'token', 'search', 'comment', 'setting'];
		// Get model name
		$scope.getModelName = function(model) {
			// If exhibition
			if (model === 'exhibition') {
				// Return event
				return 'Event';
			}
			// Uppercase first character
			return model.substr(0, 1).toUpperCase() + model.substr(1);
		};

		// Default model is user
		$scope.truncate = {
			data: {
				model: 'artist'
			},
			submit: function() {
				// Are you sure
				if (confirm('Are you sure you want to empty ' + this.data.model + '?')) {
					// Send post
					API.post('faker/truncate/' + this.data.model, {}).then(function(response) {
						alert(response.data.message || 'Truncate failed');
					});
				}
			}
		};
		
		$scope.generate = {
			data: {
				model: 'artist',
				amount: 1
			},
			submit: function() {
				// Send post
				API.post('faker/generate/' + this.data.model, {
					amount: this.data.amount
				}).then(function(response) {
					alert(response.data.message || 'Truncate failed');
				});
			}
		};
	}
]);