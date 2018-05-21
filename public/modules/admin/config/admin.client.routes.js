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