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
