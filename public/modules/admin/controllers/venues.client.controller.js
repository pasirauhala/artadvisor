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
