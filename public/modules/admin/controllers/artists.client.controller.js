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
