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
