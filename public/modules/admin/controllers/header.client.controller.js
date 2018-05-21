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