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