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
