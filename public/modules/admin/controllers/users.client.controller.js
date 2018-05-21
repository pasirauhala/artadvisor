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
