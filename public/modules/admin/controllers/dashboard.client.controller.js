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